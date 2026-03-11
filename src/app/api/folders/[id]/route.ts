// PATCH  /api/folders/[id] — update folder
// DELETE /api/folders/[id] — delete folder (items are moved to unfiled)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UpdateFolderRequest } from "@/types";

async function authorize(folderId: string, userId: string) {
  const folder = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { group: { include: { members: true } } },
  });
  if (!folder) return null;
  const isMember = folder.group.members.some((m) => m.userId === userId);
  if (!isMember) return null;
  return folder;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const folder = await authorize(params.id, userId);
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body: UpdateFolderRequest = await req.json();

  const updated = await prisma.folder.update({
    where: { id: params.id },
    data: {
      ...(body.name            && { name:            body.name.trim() }),
      ...(body.icon            && { icon:            body.icon }),
      ...(body.backgroundColor && { backgroundColor: body.backgroundColor }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const folder = await authorize(params.id, userId);
  if (!folder) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Items in this folder become unfiled (folderId → null) via ON DELETE SET NULL
  await prisma.folder.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
