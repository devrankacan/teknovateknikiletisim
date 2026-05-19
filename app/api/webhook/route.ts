import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastSSE } from "@/lib/sse";

// Meta webhook doğrulaması (GET)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// Gelen mesajları işle (POST)
export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    for (const entry of body.entry ?? []) {
      // WhatsApp
      for (const change of entry.changes ?? []) {
        if (change.field === "messages") {
          await handleWhatsAppMessage(change.value);
        }
      }

      // Instagram / Messenger
      for (const messaging of entry.messaging ?? []) {
        if (messaging.message?.text) {
          await handleMetaMessage({
            platform: body.object === "instagram" ? "instagram" : "messenger",
            senderId: messaging.sender.id,
            senderName: messaging.sender.id,
            text: messaging.message.text,
            platformMsgId: messaging.message.mid,
          });
        }
      }
    }
  } catch (err) {
    console.error("Webhook işleme hatası:", err);
  }

  return NextResponse.json({ ok: true });
}

async function handleWhatsAppMessage(value: {
  contacts?: { profile: { name: string }; wa_id: string }[];
  messages?: { from: string; id: string; text?: { body: string }; type: string }[];
}) {
  const messages = value.messages ?? [];
  const contacts = value.contacts ?? [];

  for (const msg of messages) {
    if (msg.type !== "text" || !msg.text?.body) continue;

    const contact = contacts.find((c) => c.wa_id === msg.from);
    const senderName = contact?.profile?.name ?? msg.from;

    await handleMetaMessage({
      platform: "whatsapp",
      senderId: msg.from,
      senderName,
      text: msg.text.body,
      platformMsgId: msg.id,
    });
  }
}

async function handleMetaMessage(params: {
  platform: string;
  senderId: string;
  senderName: string;
  text: string;
  platformMsgId?: string;
}) {
  const { platform, senderId, senderName, text, platformMsgId } = params;

  // Varolan konuşmayı bul veya yeni oluştur
  let conv = await prisma.conversation.findFirst({
    where: { platform, platformUserId: senderId },
  });

  if (!conv) {
    const initials = senderName
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    conv = await prisma.conversation.create({
      data: {
        platform,
        customerName: senderName,
        customerHandle: senderId,
        customerAvatar: initials,
        platformUserId: senderId,
        status: "active",
        unreadCount: 1,
        tags: JSON.stringify([]),
      },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        unreadCount: { increment: 1 },
        status: "active",
        updatedAt: new Date(),
      },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      content: text,
      sender: "customer",
      status: "delivered",
      read: false,
      platformMsgId,
    },
  });

  // Gerçek zamanlı bildirim
  broadcastSSE("new_message", {
    conversationId: conv.id,
    message,
    conversation: { ...conv, unreadCount: conv.unreadCount + 1 },
  });
}
