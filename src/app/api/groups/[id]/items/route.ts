// GET /api/groups/[id]/items?month=YYYY-MM
//
// Returns items active in the given month, enriched with their event (if paid).
// All money totals are computed here with Decimal arithmetic — never on the frontend.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import type { ItemType } from "@/types";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Invalid or missing month parameter (YYYY-MM)" },
      { status: 400 },
    );
  }

  const rawItems = await prisma.item.findMany({
    where: {
      groupId: params.id,
      startMonth: { lte: month },
      OR: [{ endMonth: null }, { endMonth: { gte: month } }],
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      folder: true,
      events: { where: { month } },
      exceptions: { where: { month } },
      balances: { where: { month } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  // Strip internal relation arrays, attach computed fields
  const items = rawItems
    .filter((item) => item.exceptions.length === 0)
    .map(({ events, exceptions, balances, ...item }) => ({
      ...item,
      defaultAmount: item.defaultAmount,
      isPaid: events.length > 0,
      event: events[0] ?? null,
      monthBalance: balances[0]?.amount,
      balance: balances[0]?.amount ?? item.defaultAmount ?? 0,
    }));

  // ── Compute totals with Decimal arithmetic (server-side) ──────────────────
  // Each unpaid item contributes to monthTotal and its folder's total.
  // Semantics:
  //   INCOME           → positive
  //   BILL             → negative
  //   CREDIT_CARD      → negative
  //   CHECKING_ACCOUNT → signed as-is (balance can be negative)
  // Sums are done by simple addition.

  let monthTotal = new Decimal(0);
  const folderTotals: Record<string, Decimal> = {};

  for (const item of items) {
    if (item.isPaid) continue;
    monthTotal = monthTotal.plus(item.balance);
    const key = item.folderId ?? "__unfiled__";
    folderTotals[key] = (folderTotals[key] ?? new Decimal(0)).plus(item.balance);
  }

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      balance: item.balance.toNumber(),
      monthTotal: monthTotal.toNumber(),
    })),
    monthTotal: monthTotal.toNumber(),
    folderTotals: Object.fromEntries(
      Object.entries(folderTotals).map(([k, v]) => [k, v.toNumber()]),
    ),
  });
}
