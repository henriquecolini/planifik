// POST   /api/items/[id]/pay  — mark item as paid/received for a month
// DELETE /api/items/[id]/pay  — unmark (undo) a payment

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { PayItemRequest } from "@/types";

import { Decimal } from "@prisma/client/runtime/library";

async function authorize(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      group: { include: { members: true } },
      balances: true, // We'll need the balance for the month being paid
    },
  });
  if (!item) return null;
  const isMember = item.group.members.some((m) => m.userId === userId);
  if (!isMember) return null;
  return item;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const item = await authorize(params.id, userId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body: PayItemRequest = await req.json();
  if (!body.month) return NextResponse.json({ error: "month is required" }, { status: 400 });

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
      balanceDeducted: body.deductBalance ?? false,
    },
    update: {
      paymentMethod: body.paymentMethod ?? null,
      paymentItemId: body.paymentItemId ?? null,
      balanceDeducted: body.deductBalance ?? false,
    },
  });

  // If the user wants to deduct from / add to an account balance, update it now
  if (body.paymentItemId && body.deductBalance) {
    const accountItem = await prisma.item.findUnique({
      where: { id: body.paymentItemId },
      include: { balances: { where: { month: body.month } } },
    });
    if (accountItem) {
      const currentBal = new Decimal(Number(accountItem.balances[0]?.amount ?? 0));
      let newBalance: Decimal;

      const itemBalance = item.balances.find((b) => b.month === body.month);
      const itemAmount = new Decimal(Number(itemBalance?.amount ?? 0)).abs();

      if (item.type === "INCOME" && accountItem.type === "CHECKING_ACCOUNT") {
        // Receiving income → add to checking account
        newBalance = currentBal.plus(itemAmount);
      } else if (
        (item.type === "BILL" || item.type === "CREDIT_CARD") &&
        accountItem.type === "CHECKING_ACCOUNT"
      ) {
        // Paying a bill from checking account → deduct
        newBalance = currentBal.minus(itemAmount);
      } else if (item.type === "CREDIT_CARD" && accountItem.type === "CHECKING_ACCOUNT") {
        // Paying a credit card from checking → deduct
        newBalance = currentBal.minus(itemAmount);
      } else {
        newBalance = currentBal;
      }

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

  const userId = session?.user?.id;
  const item = await authorize(params.id, userId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month) return NextResponse.json({ error: "month is required" }, { status: 400 });

  await prisma.itemEvent.deleteMany({
    where: { itemId: params.id, month },
  });

  return NextResponse.json({ ok: true });
}
