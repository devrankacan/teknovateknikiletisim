import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conv) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  // Mark all as read
  await prisma.message.updateMany({
    where: { conversationId: id, read: false },
    data: { read: true },
  });
  await prisma.conversation.update({
    where: { id },
    data: { unreadCount: 0 },
  });

  return NextResponse.json(conv);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const conv = await prisma.conversation.update({
    where: { id },
    data: {
      ...(body.status ? { status: body.status } : {}),
      ...(body.tags ? { tags: JSON.stringify(body.tags) } : {}),
    },
  });

  return NextResponse.json(conv);
}
