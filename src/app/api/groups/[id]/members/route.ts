// POST   /api/groups/[id]/members — invite a user by email
// DELETE /api/groups/[id]/members — remove a member (owner or self)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AddGroupMemberSchema, RemoveGroupMemberSchema } from "@/lib/validations";
import { z } from "zod";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;

  // Only owners can invite
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!membership || membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const result = AddGroupMemberSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 });
  }

  const { email } = result.data;
  const invitee = await prisma.user.findUnique({ where: { email } });
  if (!invitee) {
    return NextResponse.json({ error: "User with that email not found" }, { status: 404 });
  }

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: invitee.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "User is already a member" }, { status: 409 });
  }

  const member = await prisma.groupMember.create({
    data: { groupId: params.id, userId: invitee.id, role: "member" },
    include: { user: { select: { id: true, name: true, email: true, image: true } } },
  });

  return NextResponse.json(member, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requesterId = session?.user?.id;
  const json = await req.json();
  const result = RemoveGroupMemberSchema.safeParse(json);

  if (!result.success) {
    return NextResponse.json({ error: z.prettifyError(result.error) }, { status: 400 });
  }

  const { userId: targetUserId } = result.data;

  const requesterMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId: requesterId } },
  });

  // Allow if: requester is owner, OR requester is removing themselves
  if (!requesterMembership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (requesterMembership.role !== "owner" && requesterId !== targetUserId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId: params.id, userId: targetUserId } },
  });

  return NextResponse.json({ ok: true });
}
