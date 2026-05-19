import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { broadcastSSE } from "@/lib/sse";

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
          const platform = body.object === "instagram" ? "instagram" : "messenger";
          const token = platform === "instagram"
            ? process.env.INSTAGRAM_ACCESS_TOKEN
            : process.env.MESSENGER_ACCESS_TOKEN;

          // Kullanıcı adı ve profil fotoğrafını Messenger API'den çek
          const profile = await fetchUserProfile(messaging.sender.id, token ?? "");

          await handleMetaMessage({
            platform,
            senderId: messaging.sender.id,
            senderName: profile.name ?? messaging.sender.id,
            senderPhoto: profile.profile_pic ?? null,
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

async function fetchUserProfile(userId: string, token: string): Promise<{ name?: string; profile_pic?: string }> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${userId}?fields=name,profile_pic&access_token=${token}`
    );
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
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
      senderPhoto: null,
      text: msg.text.body,
      platformMsgId: msg.id,
    });
  }
}

async function handleMetaMessage(params: {
  platform: string;
  senderId: string;
  senderName: string;
  senderPhoto: string | null;
  text: string;
  platformMsgId?: string;
}) {
  const { platform, senderId, senderName, senderPhoto, text, platformMsgId } = params;

  let conv = await prisma.conversation.findFirst({
    where: { platform, platformUserId: senderId },
  });

  const initials = senderName
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        platform,
        customerName: senderName,
        customerHandle: senderPhoto ? senderName : senderId,
        customerAvatar: initials,
        platformUserId: senderId,
        status: "active",
        unreadCount: 1,
        tags: JSON.stringify([]),
      },
    });
  } else {
    // İsim güncellendiyse yenile
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        customerName: senderName !== senderId ? senderName : conv.customerName,
        customerAvatar: senderName !== senderId ? initials : conv.customerAvatar,
        unreadCount: { increment: 1 },
        status: "active",
        updatedAt: new Date(),
      },
    });
    conv = { ...conv, customerName: senderName, customerAvatar: initials };
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

  broadcastSSE("new_message", {
    conversationId: conv.id,
    message,
    conversation: { ...conv, unreadCount: conv.unreadCount + 1 },
  });
}
