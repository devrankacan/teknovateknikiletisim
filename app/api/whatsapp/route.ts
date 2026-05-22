import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/authMiddleware";
import { getWAStatus, startWhatsApp, requestWAPairingCode } from "@/lib/whatsappBaileys";

export async function GET(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  return NextResponse.json(getWAStatus());
}

export async function POST(req: NextRequest) {
  const user = await requireAuth(req);
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  let body: { phone?: string } = {};
  try { body = await req.json(); } catch { /* no body */ }

  await startWhatsApp();

  if (body.phone) {
    const code = await requestWAPairingCode(body.phone);
    if (!code) return NextResponse.json({ error: "Kod alınamadı" }, { status: 500 });
    return NextResponse.json({ ok: true, code });
  }

  return NextResponse.json({ ok: true });
}
