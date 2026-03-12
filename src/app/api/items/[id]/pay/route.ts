// POST   /api/items/[id]/pay  — mark item as paid/received for a month
// DELETE /api/items/[id]/pay  — unmark (undo) a payment

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PayItemRequest } from "@/types";

import { Decimal } from "@prisma/client/runtime/library";

async function authorize(itemId: string, userId: string, month: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      group: { include: { members: { where: { userId } } } },
      balances: { where: { month } },
    },
  });
  if (!item) return null;
  if (!item.group.members[0]) return null;
  return item;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body: PayItemRequest = await req.json();
  if (!body.month) return NextResponse.json({ error: "month is required" }, { status: 400 });

  const userId = session?.user?.id;
  const item = await authorize(params.id, userId, body.month);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const actionType = item.type === "INCOME" ? "received" : "paid";

  // Create (or upsert) the event record
  const event = await prisma.itemEvent.upsert({
    where: { itemId_month: { itemId: params.id, month: body.month } },
    create: {
      itemId: params.id,
      userId,
      month: body.month,
      actionType,
      paymentMethod: body.paymentMethod ?? null,
      paymentItemId: body.paymentItemId ?? null,
    },
    update: {
      paymentMethod: body.paymentMethod ?? null,
      paymentItemId: body.paymentItemId ?? null,
    },
  });

  // If the user wants to deduct from / add to an account balance, update it now
  if (body.paymentItemId) {
    const accountItem = await prisma.item.findUnique({
      where: { id: body.paymentItemId, type: { in: ["CHECKING_ACCOUNT", "CREDIT_CARD"] } },
      include: { balances: { where: { month: body.month } } },
    });
    if (accountItem) {
      const accountBalance = accountItem.balances[0]?.amount ?? accountItem.defaultAmount ?? 0;
      let newBalance: Decimal;

      const itemBalance = item.balances[0]?.amount ?? item.defaultAmount ?? new Decimal(0);

      newBalance = accountBalance.plus(itemBalance);

      await prisma.itemBalance.upsert({
        where: { itemId_month: { itemId: body.paymentItemId, month: body.month } },
        create: {
          itemId: body.paymentItemId,
          month: body.month,
          amount: newBalance,
        },
        update: {
          amount: newBalance,
        },
      });
    }
  }

  return NextResponse.json(event, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month is required" }, { status: 400 });

  const rollback = req.nextUrl.searchParams.get("rollback") === "true";

  const userId = session?.user?.id;
  const item = await authorize(params.id, userId, month);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (rollback) {
    const event = await prisma.itemEvent.findUnique({
      where: { itemId_month: { itemId: params.id, month } },
    });

    if (event?.paymentItemId) {
      const accountItem = await prisma.item.findUnique({
        where: { id: event.paymentItemId, type: { in: ["CHECKING_ACCOUNT", "CREDIT_CARD"] } },
        include: {
          balances: { where: { month } },
          events: { where: { month } },
          exceptions: { where: { month } },
        },
      });

      const isDeletedForMonth = (accountItem?.exceptions.length ?? 0) > 0;
      const isPaid = (accountItem?.events.length ?? 0) > 0;

      if (accountItem && !isDeletedForMonth && !isPaid) {
        const accountBalance =
          accountItem.balances[0]?.amount ?? accountItem.defaultAmount ?? new Decimal(0);
        const itemBalance = item.balances[0]?.amount ?? item.defaultAmount ?? new Decimal(0);

        const newBalance = accountBalance.minus(itemBalance);

        await prisma.itemBalance.upsert({
          where: { itemId_month: { itemId: event.paymentItemId, month } },
          create: {
            itemId: event.paymentItemId,
            month,
            amount: newBalance,
          },
          update: {
            amount: newBalance,
          },
        });
      }
    }
  }

  await prisma.itemEvent.deleteMany({
    where: { itemId: params.id, month },
  });

  return NextResponse.json({ ok: true });
}
