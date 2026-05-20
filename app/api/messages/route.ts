import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";
import { sendPlatformMessage } from "@/lib/metaApi";
import { broadcastSSE } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { conversationId, content, attachmentUrl } = await req.json();
  if (!conversationId || (!content?.trim() && !attachmentUrl)) {
    return NextResponse.json({ error: "Eksik alan" }, { status: 400 });
  }

  const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conv) return NextResponse.json({ error: "Konuşma bulunamadı" }, { status: 404 });

  // Gerçek platformlara gönder (token varsa)
  let delivered = false;
  if (conv.platformUserId) {
    delivered = await sendPlatformMessage(
      conv.platform,
      conv.platformUserId,
      content?.trim() ?? "",
      attachmentUrl
    );
  }

  const messageContent = content?.trim() || "[Resim]";

  const message = await prisma.message.create({
    data: {
      conversationId,
      content: messageContent,
      sender: "agent",
      status: delivered ? "delivered" : "sent",
      read: true,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date(), status: "active" },
  });

  // SSE ile tüm bağlı clientlara bildir
  broadcastSSE("new_message", { conversationId, message });

  return NextResponse.json(message);
}
