// GET    /api/items/[id]              — get item
// PATCH  /api/items/[id]              — update item fields
// DELETE /api/items/[id]?mode=&month= — delete item (with recurrence options)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMonths, fromMonthString, toMonthString } from "@/lib/utils";
import type { DeleteMode, UpdateItemRequest } from "@/types";

import { Decimal } from "@prisma/client/runtime/library";

/** Verifies the current user has access to the item's group */
async function authorize(itemId: string, userId: string) {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { group: { include: { members: true } } },
  });
  if (!item) return null;
  const isMember = item.group.members.some((m) => m.userId === userId);
  if (!isMember) return null;
  return item;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const item = await authorize(params.id, userId);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(item);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const existing = await authorize(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body: UpdateItemRequest = await req.json();

  // If resetToDefault is true, delete the month's balance record
  if (body.resetToDefault && body.month) {
    await prisma.itemBalance.deleteMany({
      where: { itemId: params.id, month: body.month },
    });
  } else if (body.monthlyBalance !== undefined && body.month) {
    // If monthlyBalance is provided, we update/create the ItemBalance record
    const balanceAmount = body.monthlyBalance !== null ? new Decimal(body.monthlyBalance) : 0;
    await prisma.itemBalance.upsert({
      where: { itemId_month: { itemId: params.id, month: body.month } },
      create: {
        itemId: params.id,
        month: body.month,
        amount: balanceAmount,
      },
      update: {
        amount: balanceAmount,
      },
    });
  }

  const updated = await prisma.item.update({
    where: { id: params.id },
    data: {
      ...(body.folderId !== undefined && { folderId: body.folderId }),
      ...(body.title !== undefined && { title: body.title.trim() }),
      ...(body.icon !== undefined && { icon: body.icon }),
      ...(body.bank !== undefined && { bank: body.bank }),
      ...(body.startMonth !== undefined && { startMonth: body.startMonth }),
      ...(body.endMonth !== undefined && { endMonth: body.endMonth }),
      ...(body.dueDay !== undefined && { dueDay: body.dueDay }),
      ...(body.dueNextMonth !== undefined && { dueNextMonth: body.dueNextMonth }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate ? new Date(body.dueDate) : null }),
      ...(body.defaultAmount !== undefined && {
        defaultAmount: body.defaultAmount !== null ? new Decimal(body.defaultAmount) : null,
      }),
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      folder: true,
      balances: body.month ? { where: { month: body.month } } : undefined,
    },
  });

  const response = {
    ...updated,
    defaultAmount: updated.defaultAmount ? new Decimal(updated.defaultAmount).toNumber() : null,
    monthBalance:
      updated.balances?.[0]?.amount != null
        ? new Decimal(updated.balances[0].amount).toNumber()
        : null,
    balance: new Decimal(updated.balances?.[0]?.amount ?? updated.defaultAmount ?? 0).toNumber(),
  };
  delete (response as any).balances;

  return NextResponse.json(response);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const existing = await authorize(params.id, userId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const mode = (req.nextUrl.searchParams.get("mode") ?? "all") as DeleteMode;
  const month = req.nextUrl.searchParams.get("month"); // "YYYY-MM"

  if (mode === "all") {
    // Hard delete — removes the item and all its events/exceptions via cascade
    await prisma.item.delete({ where: { id: params.id } });
  } else if (mode === "this") {
    // Skip just this month: create an exception record
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    await prisma.itemException.upsert({
      where: { itemId_month: { itemId: params.id, month } },
      create: { itemId: params.id, month },
      update: {},
    });
  } else if (mode === "following") {
    // Terminate the item at the month before `month`
    if (!month) return NextResponse.json({ error: "month required" }, { status: 400 });
    const prevMonth = toMonthString(addMonths(fromMonthString(month), -1));

    if (prevMonth < existing.startMonth) {
      // The item has no months before this one — delete entirely
      await prisma.item.delete({ where: { id: params.id } });
    } else {
      await prisma.item.update({
        where: { id: params.id },
        data: { endMonth: prevMonth },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
