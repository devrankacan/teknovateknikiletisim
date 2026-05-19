import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  const msgs = await prisma.message.deleteMany({});
  const convs = await prisma.conversation.deleteMany({});
  console.log(`Silindi: ${msgs.count} mesaj, ${convs.count} konuşma.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
