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
      password: "teknovateknik2025",
      name: "Teknovateknik Destek",
      role: "admin",
      avatar: "TT",
    },
  });

  // Örnek konuşmalar
  const conv1 = await prisma.conversation.create({
    data: {
      platform: "whatsapp",
      customerName: "Ahmet Yılmaz",
      customerHandle: "+90 532 123 45 67",
      customerAvatar: "AY",
      platformUserId: "+90532123456",
      status: "active",
      unreadCount: 2,
      tags: JSON.stringify(["teknik destek"]),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        content: "Merhaba, ürünleriniz hakkında bilgi alabilir miyim?",
        sender: "customer",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 20 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        content: "Tabii ki! Size yardımcı olmaktan memnuniyet duyarız. Hangi ürün hakkında bilgi almak istiyorsunuz?",
        sender: "agent",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        content: "Endüstriyel ekipmanlarınızı merak ediyorum.",
        sender: "customer",
        status: "delivered",
        read: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
    ],
  });

  const conv2 = await prisma.conversation.create({
    data: {
      platform: "instagram",
      customerName: "Elif Kaya",
      customerHandle: "@elifkaya_design",
      customerAvatar: "EK",
      platformUserId: "ig_user_elif_123",
      status: "active",
      unreadCount: 1,
      tags: JSON.stringify(["satış"]),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        content: "Merhaba! Ürünlerinizi Instagram'dan gördüm, harika görünüyor.",
        sender: "customer",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 45 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        content: "Teşekkür ederiz! Size nasıl yardımcı olabiliriz?",
        sender: "agent",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 40 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        content: "Fiyat listesi gönderebilir misiniz?",
        sender: "customer",
        status: "delivered",
        read: false,
        createdAt: new Date(Date.now() - 25 * 60 * 1000),
      },
    ],
  });

  const conv3 = await prisma.conversation.create({
    data: {
      platform: "messenger",
      customerName: "Mehmet Demir",
      customerHandle: "Mehmet Demir",
      customerAvatar: "MD",
      platformUserId: "fb_user_mehmet_456",
      status: "pending",
      unreadCount: 0,
      tags: JSON.stringify(["kurulum"]),
    },
  });

  await prisma.message.createMany({
    data: [
      {
        conversationId: conv3.id,
        content: "Merhaba, sistemin kurulumu ne kadar sürer?",
        sender: "customer",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        conversationId: conv3.id,
        content: "Merhaba Mehmet Bey! Standart kurulum 2-3 iş günü içinde tamamlanır.",
        sender: "agent",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 90 * 60 * 1000),
      },
      {
        conversationId: conv3.id,
        content: "Teklif için ne zaman dönebilirsiniz?",
        sender: "customer",
        status: "read",
        read: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
    ],
  });

  console.log("Seed tamamlandı.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
