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

function displayId(jid: string) {
  return jid.replace("@s.whatsapp.net", "").replace("@c.us", "").replace("@lid", "");
}

async function upsertWAMessage(
  jid: string,
  text: string,
  platformMsgId: string | undefined,
  pushName: string,
  sender: "customer" | "agent"
) {
  if (platformMsgId) {
    const exists = await prisma.message.findFirst({ where: { platformMsgId } });
    if (exists) return;
  }

  const handle = displayId(jid);
  const initials = pushName.split(" ").filter(Boolean).map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) || "?";

  let conv = await prisma.conversation.findFirst({
    where: { platform: "whatsapp", platformUserId: jid },
  });

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        platform: "whatsapp",
        customerName: pushName,
        customerHandle: handle,
        customerAvatar: initials,
        platformUserId: jid,
        status: "active",
        unreadCount: sender === "customer" ? 1 : 0,
        tags: JSON.stringify([]),
      },
    });
  } else if (sender === "customer") {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { unreadCount: { increment: 1 }, updatedAt: new Date() },
    });
  } else {
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conv.id,
      content: text,
      sender,
      status: sender === "agent" ? "sent" : "delivered",
      read: sender === "agent",
      platformMsgId,
    },
  });

  broadcastSSE("new_message", {
    conversationId: conv.id,
    message,
    conversation: { ...conv, unreadCount: sender === "customer" ? conv.unreadCount + 1 : conv.unreadCount },
  });
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

  // Real-time incoming and outgoing messages
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? "";
      if (jid === "status@broadcast" || jid.endsWith("@broadcast")) continue;
      if (jid.includes("@g.us")) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";
      if (!text) continue;

      const platformMsgId = msg.key.id ?? undefined;
      const isOutgoing = !!msg.key.fromMe;
      const pushName = isOutgoing ? "Siz" : (msg.pushName || displayId(jid));

      await upsertWAMessage(jid, text, platformMsgId, pushName, isOutgoing ? "agent" : "customer");
    }
  });

  // History sync — recent messages when first connecting
  sock.ev.on("messaging-history.set", async ({ messages, isLatest }) => {
    if (!isLatest) return;
    for (const msg of messages) {
      const jid = msg.key.remoteJid ?? "";
      if (jid === "status@broadcast" || jid.endsWith("@broadcast")) continue;
      if (jid.includes("@g.us")) continue;

      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        "";
      if (!text) continue;

      const isOutgoing = !!msg.key.fromMe;
      const platformMsgId = msg.key.id ?? undefined;
      const pushName = isOutgoing ? "Siz" : (msg.pushName || displayId(jid));

      await upsertWAMessage(jid, text, platformMsgId, pushName, isOutgoing ? "agent" : "customer");
    }
  });
}

export async function requestWAPairingCode(phoneNumber: string): Promise<string | null> {
  const phone = phoneNumber.replace(/\D/g, "");

  let waited = 0;
  while (!sock && waited < 10000) {
    await new Promise((r) => setTimeout(r, 300));
    waited += 300;
  }
  if (!sock) return null;

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
  } catch (e) {
    console.error("[wa] send error", e);
    return false;
  }
}
