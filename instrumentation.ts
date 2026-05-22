export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startWhatsApp } = await import("./lib/whatsappBaileys");
    await startWhatsApp();
  }
}
