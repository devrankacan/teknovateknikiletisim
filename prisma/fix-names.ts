import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const convs = await prisma.conversation.findMany();
  for (const conv of convs) {
    const isNumeric = /^\d{10,}$/.test(conv.customerName);
    if (isNumeric) {
      const newName = conv.platform === "instagram" ? "Instagram Kullanıcısı" : "Messenger Kullanıcısı";
      await prisma.conversation.update({
        where: { id: conv.id },
        data: { customerName: newName, customerAvatar: conv.platform === "instagram" ? "IG" : "MS" },
      });
      console.log(`Güncellendi: ${conv.customerName} → ${newName}`);
    }
  }
  console.log("Tamamlandı.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
