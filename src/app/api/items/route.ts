// POST /api/items — create a new item

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CreateItemRequest } from "@/types";

import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const body: CreateItemRequest = await req.json();

  // Verify the user belongs to the group
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: body.groupId, userId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Validate required fields
  if (!body.title?.trim())
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!body.type) return NextResponse.json({ error: "Type is required" }, { status: 400 });
  if (body.amount === undefined)
    return NextResponse.json({ error: "Amount is required" }, { status: 400 });
  if (!body.startMonth)
    return NextResponse.json({ error: "Start month is required" }, { status: 400 });

  const item = await prisma.item.create({
    data: {
      groupId: body.groupId,
      folderId: body.folderId ?? null,
      userId,
      title: body.title.trim(),
      type: body.type,
      icon: body.icon ?? "💰",
      bank: body.bank ?? null,
      startMonth: body.startMonth,
      endMonth: body.endMonth ?? null,
      dueDay: body.dueDay ?? null,
      dueNextMonth: body.dueNextMonth ?? false,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      defaultAmount:
        body.defaultAmount !== undefined && body.defaultAmount !== null
          ? new Decimal(body.defaultAmount)
          : null,
      balances:
        body.amount !== null
          ? {
              create: {
                month: body.month ?? body.startMonth,
                amount: new Decimal(body.amount ?? 0),
              },
            }
          : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      folder: true,
      balances: { where: { month: body.month ?? body.startMonth } },
    },
  });

  const response = {
    ...item,
    defaultAmount: item.defaultAmount ? new Decimal(item.defaultAmount).toNumber() : null,
    monthBalance:
      item.balances[0]?.amount != null ? new Decimal(item.balances[0].amount).toNumber() : null,
    balance: new Decimal(item.balances[0]?.amount ?? item.defaultAmount ?? 0).toNumber(),
  };
  delete (response as any).balances;

  return NextResponse.json(response, { status: 201 });
}
