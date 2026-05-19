import { NextRequest, NextResponse } from "next/server";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const LOGO_PATH = path.resolve(process.cwd(), "public/company-logo.png");

export async function GET() {
  try {
    await readFile(LOGO_PATH);
    return NextResponse.json({ url: "/company-logo.png" });
  } catch {
    return NextResponse.json({ url: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { base64 } = await req.json();
    const data = base64.replace(/^data:image\/\w+;base64,/, "");
    await writeFile(LOGO_PATH, Buffer.from(data, "base64"));
    return NextResponse.json({ url: "/company-logo.png" });
  } catch (err) {
    console.error("Logo kaydetme hatası:", err);
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
