// GET  /api/folders?groupId= — list folders in a group
// POST /api/folders           — create a folder

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CreateFolderRequest } from "@/types";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session?.user?.id;
  const body: CreateFolderRequest = await req.json();

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: body.groupId, userId } },
  });
  if (!member) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Set position to be last
  const maxPos = await prisma.folder.aggregate({
    where: { groupId: body.groupId },
    _max: { position: true },
  });

  const folder = await prisma.folder.create({
    data: {
      groupId: body.groupId,
      name: body.name.trim(),
      icon: body.icon ?? "📁",
      backgroundColor: body.backgroundColor ?? "#112038",
      position: (maxPos._max.position ?? -1) + 1,
    },
  });

  return NextResponse.json(folder, { status: 201 });
}
