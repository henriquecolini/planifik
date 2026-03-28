// POST /api/items — create a new item

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateItemSchema } from "@/lib/validations";
import type { CreateItemRequest, ErrorResponse, Item } from "@/types";
import { z } from "zod";

import { Decimal } from "@prisma/client/runtime/library";

export async function POST(req: NextRequest): Promise<NextResponse<ErrorResponse | Item>> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const json = await req.json();
  const result = CreateItemSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 });
  }

  const body: CreateItemRequest = result.data;

  // Verify the user belongs to the group
  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: body.groupId, userId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
    monthAmount:
      item.balances[0]?.amount != null ? new Decimal(item.balances[0].amount).toNumber() : null,
    practicalAmount: new Decimal(item.balances[0]?.amount ?? item.defaultAmount ?? 0).toNumber(),
    dueDate: item.dueDate?.toJSON() ?? null,
    createdAt: item.createdAt?.toJSON() ?? null,
    updatedAt: item.updatedAt?.toJSON() ?? null,
  };
  delete (response as any).balances;

  return NextResponse.json(response, { status: 201 });
}
