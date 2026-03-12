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
    return NextResponse.json({ error: "Invalid or missing month parameter (YYYY-MM)" }, { status: 400 });
  }

  const rawItems = await prisma.item.findMany({
    where: {
      groupId: params.id,
      startMonth: { lte: month },
      OR: [{ endMonth: null }, { endMonth: { gte: month } }],
    },
    include: {
      user:       { select: { id: true, name: true, email: true, image: true } },
      folder:     true,
      events:     { where: { month } },
      exceptions: { where: { month } },
      balances:   { where: { month } },
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
  });

  // Strip internal relation arrays, attach computed fields
  const items = rawItems
    .filter((item) => item.exceptions.length === 0)
    .map(({ events, exceptions, balances, ...item }) => ({
      ...item,
      defaultAmount: item.defaultAmount ? new Decimal(item.defaultAmount).toNumber() : null,
      isPaid:  events.length > 0,
      event:   events[0] ?? null,
      monthBalance: balances[0]?.amount != null ? new Decimal(balances[0].amount).toNumber() : null,
      balance: new Decimal(balances[0]?.amount ?? item.defaultAmount ?? 0).toNumber(),
    }));

  // ── Compute totals with Decimal arithmetic (server-side) ──────────────────
  // Each unpaid item contributes to monthTotal and its folder's total.
  // Semantics:
  //   INCOME           → positive (money in)
  //   BILL             → negative (money out), balance stored as positive magnitude
  //   CREDIT_CARD      → negative, balance = amount owed (positive magnitude)
  //   CHECKING_ACCOUNT → signed as-is (balance can be negative)

  let monthTotal = new Decimal(0);
  const folderTotals: Record<string, Decimal> = {};

  for (const item of items) {
    if (item.isPaid) continue;

    const bal = new Decimal(item.balance);
    const contribution = itemContribution(item.type as ItemType, bal);

    monthTotal = monthTotal.plus(contribution);

    const key = item.folderId ?? "__unfiled__";
    folderTotals[key] = (folderTotals[key] ?? new Decimal(0)).plus(contribution);
  }

  return NextResponse.json({
    items,
    monthTotal:   monthTotal.toNumber(),
    folderTotals: Object.fromEntries(
      Object.entries(folderTotals).map(([k, v]) => [k, v.toNumber()])
    ),
  });
}

/** Returns the signed contribution of one item to the period total. */
function itemContribution(type: ItemType, balance: Decimal): Decimal {
  switch (type) {
    case "INCOME":           return balance.abs();
    case "BILL":             return balance.abs().negated();
    case "CREDIT_CARD":      return balance.abs().negated();
    case "CHECKING_ACCOUNT": return balance; // sign is meaningful
    default:                 return new Decimal(0);
  }
}
