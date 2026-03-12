// POST /api/groups/[id]/reorder
//
// Updates the position (and optionally folderId) of items and folders.
// Called after a drag-and-drop operation.
// Body: { folders?: {id, position}[], items?: {id, position, folderId}[] }

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: params.id, userId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as {
    folders?: { id: string; position: number }[];
    items?: { id: string; position: number; folderId: string | null }[];
  };

  await prisma.$transaction([
    ...(body.folders ?? []).map(({ id, position }) =>
      prisma.folder.update({ where: { id }, data: { position } }),
    ),
    ...(body.items ?? []).map(({ id, position, folderId }) =>
      prisma.item.update({ where: { id }, data: { position, folderId } }),
    ),
  ]);

  return NextResponse.json({ ok: true });
}
