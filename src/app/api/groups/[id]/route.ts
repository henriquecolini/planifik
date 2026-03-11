// GET    /api/groups/[id] — get group detail
// PATCH  /api/groups/[id] — rename group
// DELETE /api/groups/[id] — delete group (owner only)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireMembership(groupId: string, userId: string) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  });
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as typeof session.user & { id: string }).id;
  const member = await requireMembership(params.id, userId);
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const group = await prisma.group.findUnique({
    where: { id: params.id },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  });

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(group);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as typeof session.user & { id: string }).id;
  const member = await requireMembership(params.id, userId);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  const group = await prisma.group.update({
    where: { id: params.id },
    data: { name: name.trim() },
  });

  return NextResponse.json(group);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as typeof session.user & { id: string }).id;
  const member = await requireMembership(params.id, userId);
  if (!member || member.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.group.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
