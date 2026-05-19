import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const LOGO_FILE = path.resolve(process.cwd(), "logo-data.json");

export async function GET() {
  try {
    const raw = await readFile(LOGO_FILE, "utf-8");
    const { dataUrl } = JSON.parse(raw);
    return NextResponse.json({ dataUrl });
  } catch {
    return NextResponse.json({ dataUrl: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    await writeFile(LOGO_FILE, JSON.stringify({ dataUrl: base64 }), "utf-8");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Logo kaydetme hatası:", err);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
