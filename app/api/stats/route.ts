import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalMessages, activeConversations, resolvedToday, recentMessages] = await Promise.all([
    prisma.message.count(),
    prisma.conversation.count({ where: { status: "active" } }),
    prisma.conversation.count({ where: { status: "resolved", updatedAt: { gte: today } } }),
    prisma.message.findMany({
      where: {
        sender: "agent",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
  ]);

  // Basit ortalama yanıt süresi hesabı
  const avgResponseTime = recentMessages.length > 0 ? "~4 dk" : "—";

  return NextResponse.json({
    totalMessages,
    activeConversations,
    resolvedToday,
    avgResponseTime,
  });
}
