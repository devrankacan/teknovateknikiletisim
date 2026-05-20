import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/authMiddleware";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform");
  const status = searchParams.get("status");
  const excludeStatus = searchParams.get("excludeStatus");
  const search = searchParams.get("search");

  const conversations = await prisma.conversation.findMany({
    where: {
      ...(platform && platform !== "all" ? { platform } : {}),
      ...(status && status !== "all" ? { status } : {}),
      ...(excludeStatus ? { NOT: { status: excludeStatus } } : {}),
      ...(search
        ? {
            OR: [
              { customerName: { contains: search } },
              { customerHandle: { contains: search } },
            ],
          }
        : {}),
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(conversations);
}
