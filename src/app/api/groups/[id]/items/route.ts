// GET /api/groups/[id]/items?month=YYYY-MM
//
// Returns items active in the given month, enriched with their event (if paid).
// All money totals are computed here with Decimal arithmetic — never on the frontend.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

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

  // ── Fetch folders and items ─────────────────────────────────────────────
  const folders = await prisma.folder.findMany({
    where: { groupId: params.id },
    orderBy: { position: "asc" },
  });

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
  const items = await Promise.all(
    rawItems
      .filter((item) => item.exceptions.length === 0)
      .map(async ({ events, exceptions, balances, ...item }) => {
        let paymentAccountItem = null;
        const event = events[0] ?? null;

        if (event?.paymentItemId) {
          const accountItem = await prisma.item.findUnique({
            where: { id: event.paymentItemId, type: { in: ["CHECKING_ACCOUNT", "CREDIT_CARD"] } },
            include: {
              events: { where: { month } },
              exceptions: { where: { month } },
            },
          });

          const isDeletedForMonth = accountItem?.exceptions.length ?? 0 > 0;
          const isPaid = accountItem?.events.length ?? 0 > 0;

          if (accountItem && !isDeletedForMonth && !isPaid) {
            paymentAccountItem = {
              id: accountItem.id,
              title: accountItem.title,
              type: accountItem.type,
            };
          }
        }

        return {
          ...item,
          defaultAmount: item.defaultAmount,
          isPaid: events.length > 0,
          event: event
            ? {
                ...event,
                paymentAccountItem,
              }
            : null,
          monthBalance: balances[0]?.amount,
          balance: balances[0]?.amount ?? item.defaultAmount ?? new Decimal(0),
        };
      }),
  );

  // ── Group items and compute totals with Decimal arithmetic (server-side) ──────────────────
  let monthTotal = new Decimal(0);
  const unfiled: any[] = [];
  const foldersWithItems = folders.map((f) => {
    const folderItems = items.filter((i) => i.folderId === f.id);
    let totalAmount = new Decimal(0);

    for (const item of folderItems) {
      if (!item.isPaid) {
        totalAmount = totalAmount.plus(item.balance);
        monthTotal = monthTotal.plus(item.balance);
      }
    }

    return {
      ...f,
      items: folderItems.map((i) => ({ ...i, balance: i.balance.toNumber() })),
      totalAmount: totalAmount.toNumber(),
    };
  });

  for (const item of items) {
    if (!item.folderId) {
      if (!item.isPaid) {
        monthTotal = monthTotal.plus(item.balance);
      }
      unfiled.push({ ...item, balance: item.balance.toNumber() });
    }
  }

  return NextResponse.json({
    folders: foldersWithItems,
    unfiled,
    monthTotal: monthTotal.toNumber(),
  });
}
