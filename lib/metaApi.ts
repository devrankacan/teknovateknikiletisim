const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

const BASE_URL = "https://sosyal.teknovateknik.com";

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!phoneNumberId || !token) return false;

  const res = await fetch(`${META_GRAPH_URL}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { preview_url: false, body: text },
    }),
  });
  return res.ok;
}

export async function sendInstagramMessage(
  recipientId: string,
  text: string,
  attachmentUrl?: string
): Promise<boolean> {
  const pageId = process.env.INSTAGRAM_PAGE_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!pageId || !token) return false;

  const res = await fetch(`${META_GRAPH_URL}/${pageId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(
      attachmentUrl
        ? {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: "image",
                payload: { url: BASE_URL + attachmentUrl, is_reusable: true },
              },
            },
            messaging_type: "RESPONSE",
          }
        : {
            recipient: { id: recipientId },
            message: { text },
            messaging_type: "RESPONSE",
          }
    ),
  });
  return res.ok;
}

export async function sendMessengerMessage(
  recipientId: string,
  text: string,
  attachmentUrl?: string
): Promise<boolean> {
  const pageId = process.env.MESSENGER_PAGE_ID;
  const token = process.env.MESSENGER_ACCESS_TOKEN;
  if (!pageId || !token) return false;

  const res = await fetch(`${META_GRAPH_URL}/${pageId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(
      attachmentUrl
        ? {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: "image",
                payload: { url: BASE_URL + attachmentUrl, is_reusable: true },
              },
            },
            messaging_type: "RESPONSE",
          }
        : {
            recipient: { id: recipientId },
            message: { text },
            messaging_type: "RESPONSE",
          }
    ),
  });
  return res.ok;
}

export async function sendPlatformMessage(
  platform: string,
  recipientId: string,
  text: string,
  attachmentUrl?: string
): Promise<boolean> {
  switch (platform) {
    case "whatsapp":
      return sendWhatsAppMessage(recipientId, text);
    case "instagram":
      return sendInstagramMessage(recipientId, text, attachmentUrl);
    case "messenger":
      return sendMessengerMessage(recipientId, text, attachmentUrl);
    default:
      return false;
  }
}
