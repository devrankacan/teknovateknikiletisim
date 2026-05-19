import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const dbPath = path.resolve(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  // Admin kullanıcısı
  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: "Tknv@2026!Sec",
      name: "Teknovateknik Destek",
      role: "admin",
      avatar: "TT",
    },
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
