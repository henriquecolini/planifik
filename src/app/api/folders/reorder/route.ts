// PATCH /api/folders/reorder
// Reorders folders in a group based on a list of IDs.

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const { folderIds } = await req.json();

  if (!Array.isArray(folderIds) || folderIds.length === 0) {
    return NextResponse.json({ error: "folderIds must be a non-empty array" }, { status: 400 });
  }

  // 1. Get first folder to check group and permissions
  const firstFolder = await prisma.folder.findUnique({
    where: { id: folderIds[0] },
    include: { group: { include: { members: true } } },
  });

  if (!firstFolder) return NextResponse.json({ error: "First folder not found" }, { status: 404 });
  const isMember = firstFolder.group.members.some((m) => m.userId === userId);
  if (!isMember) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // 2. Perform bulk update
  // Since Prisma doesn't support bulk update for different values, we use a transaction
  await prisma.$transaction(
    folderIds.map((id, index) =>
      prisma.folder.update({
        where: { id },
        data: { position: index },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
