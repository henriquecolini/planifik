// GET  /api/groups — list all groups the current user belongs to
// POST /api/groups — create a new group

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CreateGroupSchema } from "@/lib/validations";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true, email: true, image: true } } },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const groups = memberships.map((m) => ({ ...m.group, role: m.role }));
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const json = await req.json();
  const result = CreateGroupSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 });
  }

  const { name } = result.data;

  const group = await prisma.group.create({
    data: {
      name: name.trim(),
      members: { create: { userId, role: "owner" } },
    },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  return NextResponse.json(group, { status: 201 });
}
