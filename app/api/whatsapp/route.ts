import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { getWAStatus, startWhatsApp } from "@/lib/whatsappBaileys";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json(getWAStatus());
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  await startWhatsApp();
  return NextResponse.json({ ok: true });
}
