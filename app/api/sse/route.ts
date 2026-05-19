import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { addSSEClient, removeSSEClient } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const clientId = crypto.randomUUID();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => {
        try {
          controller.enqueue(new TextEncoder().encode(data));
        } catch {
          removeSSEClient(clientId);
        }
      };

      addSSEClient(clientId, send);

      // Bağlantı sağlığı için ping
      send(`: connected\n\n`);
      const ping = setInterval(() => {
        send(`: ping\n\n`);
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(ping);
        removeSSEClient(clientId);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
