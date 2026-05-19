import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const convs = await prisma.conversation.findMany({ orderBy: { createdAt: "asc" } });

  // Numara görünen konuşmaları "Instagram/Messenger Kullanıcısı" olarak güncelle
  for (const conv of convs) {
    const isNumeric = /^\d{8,}$/.test(conv.customerName);
    if (isNumeric) {
      const newName = conv.platform === "instagram" ? "Instagram Kullanıcısı" : "Messenger Kullanıcısı";
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { customerName: newName, customerAvatar: conv.platform === "instagram" ? "IG" : "MS" },
      });
      console.log(`İsim güncellendi: ${conv.customerName} → ${newName}`);
    }
  }

  // Aynı platformUserId + platform çiftinden birden fazla konuşma varsa eskisini sil
  const seen = new Map<string, string>();
  for (const conv of convs) {
    if (!conv.platformUserId) continue;
    const key = `${conv.platform}:${conv.platformUserId}`;
    if (seen.has(key)) {
      const oldId = seen.get(key)!;
      await prisma.message.deleteMany({ where: { conversationId: oldId } });
      await prisma.conversation.delete({ where: { id: oldId } });
      console.log(`Duplicate silindi: ${oldId}`);
    }
    seen.set(key, conv.id);
  }

  console.log("Tamamlandı.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
