import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as path from "path";
import { prisma } from "./db";
import { broadcastSSE } from "./sse";

const AUTH_DIR = path.resolve(process.cwd(), "storage", "whatsapp-auth");

let sock: ReturnType<typeof makeWASocket> | null = null;
let qrCode: string | null = null;
let status: "disconnected" | "connecting" | "connected" = "disconnected";

export function getWAStatus() {
  return { status, qrCode };
}

export async function startWhatsApp() {
  if (status === "connected" || status === "connecting") return;
  status = "connecting";

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, console as never),
    },
    printQRInTerminal: false,
    browser: ["Teknovateknik", "Chrome", "1.0"],
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      broadcastSSE("wa_qr", { qr });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      status = "disconnected";
      qrCode = null;
      broadcastSSE("wa_disconnected", {});
      if (shouldReconnect) {
        setTimeout(() => startWhatsApp(), 3000);
      }
    } else if (connection === "open") {
      status = "connected";
      qrCode = null;
      broadcastSSE("wa_connected", {});
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    console.log("[wa] messages.upsert type:", type, "count:", messages.length);
    if (type !== "notify") return;

    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? "";
      console.log("[wa] msg fromMe:", msg.key.fromMe, "jid:", jid, "text:", msg.message?.conversation?.slice(0, 50));

      // Skip outgoing, broadcasts, status and group messages
      if (msg.key.fromMe) continue;
      if (jid === "status@broadcast" || jid.endsWith("@broadcast")) continue;
      if (jid.includes("@g.us")) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";
      if (!text) continue;

      // Support both @s.whatsapp.net and newer @lid format
      const senderId = jid
        .replace("@s.whatsapp.net", "")
        .replace("@c.us", "")
        .replace("@lid", "");
      if (!senderId) continue;

      const platformMsgId = msg.key.id ?? undefined;

      if (platformMsgId) {
        const exists = await prisma.message.findFirst({ where: { platformMsgId } });
        if (exists) continue;
      }

      const pushName = msg.pushName || senderId;

      let conv = await prisma.conversation.findFirst({
        where: { platform: "whatsapp", platformUserId: senderId },
      });

      const initials = pushName
        .split(" ")
        .filter(Boolean)
        .map((w: string) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            platform: "whatsapp",
            customerName: pushName,
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
          data: { unreadCount: { increment: 1 }, updatedAt: new Date() },
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

      broadcastSSE("new_message", {
        conversationId: conv.id,
        message,
        conversation: { ...conv, unreadCount: conv.unreadCount + 1 },
      });
    }
  });
}

export async function requestWAPairingCode(phoneNumber: string): Promise<string | null> {
  const phone = phoneNumber.replace(/\D/g, "");

  // Wait up to 10s for socket to exist
  let waited = 0;
  while (!sock && waited < 10000) {
    await new Promise((r) => setTimeout(r, 300));
    waited += 300;
  }
  if (!sock) return null;

  // Give socket a moment to register with WA servers before requesting code
  await new Promise((r) => setTimeout(r, 1500));

  try {
    const code = await sock.requestPairingCode(phone);
    return code ?? null;
  } catch {
    return null;
  }
}

export async function sendWAMessage(to: string, text: string): Promise<boolean> {
  if (!sock || status !== "connected") return false;
  try {
    const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text });
    return true;
  } catch {
    return false;
  }
}
