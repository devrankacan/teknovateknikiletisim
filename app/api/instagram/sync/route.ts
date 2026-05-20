import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";
import { broadcastSSE } from "@/lib/sse";

const GRAPH = "https://graph.facebook.com/v21.0";

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const pageId = process.env.INSTAGRAM_PAGE_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!pageId || !token) {
    return NextResponse.json({ error: "Instagram token ayarlı değil" }, { status: 500 });
  }

  const fields = "participants,messages{message,from,created_time,id}";
  const baseUrl = `${GRAPH}/${pageId}/conversations?platform=instagram&fields=${fields}&access_token=${token}`;

  // Hem normal gelen kutusu hem de bekleyen mesaj isteklerini çek
  const [inboxRes, pendingRes] = await Promise.all([
    fetch(baseUrl),
    fetch(`${baseUrl}&folder=pending`),
  ]);

  console.log("[instagram-sync] inbox status:", inboxRes.status, "pending status:", pendingRes.status);

  const inboxData = inboxRes.ok ? await inboxRes.json() : { data: [] };
  const pendingData = pendingRes.ok ? await pendingRes.json() : { data: [] };

  console.log("[instagram-sync] inbox count:", inboxData.data?.length ?? 0, "pending count:", pendingData.data?.length ?? 0);

  // pending'dekiler "request" statüsüyle işaretlenir
  const conversations = [
    ...(inboxData.data ?? []).map((c: Record<string, unknown>) => ({ ...c, _folder: "inbox" })),
    ...(pendingData.data ?? []).map((c: Record<string, unknown>) => ({ ...c, _folder: "pending" })),
  ];
  let newCount = 0;

  for (const conv of conversations) {
    const participants: { id: string; name: string }[] = conv.participants?.data ?? [];
    const customer = participants.find((p) => p.id !== pageId);
    if (!customer) continue;

    const messages: { id: string; message?: string; from: { id: string; name: string }; created_time: string }[] =
      conv.messages?.data ?? [];

    // En eski mesajı bul (reverse chronological gelir)
    const firstMsg = messages[messages.length - 1];
    if (!firstMsg?.message) continue;

    // Zaten var mı?
    const existing = await prisma.conversation.findFirst({
      where: { platform: "instagram", platformUserId: customer.id },
    });

    if (!existing) {
      const initials = customer.name
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

      const newConv = await prisma.conversation.create({
        data: {
          platform: "instagram",
          customerName: customer.name,
          customerHandle: customer.id,
          customerAvatar: initials,
          platformUserId: customer.id,
          status: conv._folder === "pending" ? "request" : "active",
          unreadCount: messages.length,
          tags: JSON.stringify([]),
        },
      });

      // Tüm mesajları ekle (en eskiden en yeniye)
      for (const msg of [...messages].reverse()) {
        if (!msg.message) continue;
        const alreadyExists = await prisma.message.findFirst({ where: { platformMsgId: msg.id } });
        if (alreadyExists) continue;
        const saved = await prisma.message.create({
          data: {
            conversationId: newConv.id,
            content: msg.message,
            sender: msg.from.id === pageId ? "agent" : "customer",
            status: "delivered",
            read: false,
            platformMsgId: msg.id,
          },
        });
        broadcastSSE("new_message", {
          conversationId: newConv.id,
          message: saved,
          conversation: newConv,
        });
      }
      newCount++;
    } else {
      // Mevcut konuşmaya yeni mesaj var mı?
      for (const msg of [...messages].reverse()) {
        if (!msg.message) continue;
        const alreadyExists = await prisma.message.findFirst({ where: { platformMsgId: msg.id } });
        if (alreadyExists) continue;
        const saved = await prisma.message.create({
          data: {
            conversationId: existing.id,
            content: msg.message,
            sender: msg.from.id === pageId ? "agent" : "customer",
            status: "delivered",
            read: false,
            platformMsgId: msg.id,
          },
        });
        await prisma.conversation.update({
          where: { id: existing.id },
          data: { unreadCount: { increment: 1 }, updatedAt: new Date() },
        });
        broadcastSSE("new_message", {
          conversationId: existing.id,
          message: saved,
        });
        newCount++;
      }
    }
  }

  return NextResponse.json({ ok: true, newCount });
}
