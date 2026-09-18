import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OlxApiClient } from "@/lib/olx/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const accounts = await prisma.olxAccount.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            threads: true,
          },
        },
        threads: {
          select: {
            unreadCount: true,
          },
        },
      },
    });

    const formatted = accounts.map((acc) => {
      const totalUnread = acc.threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0);
      return {
        id: acc.id,
        olxUserId: acc.olxUserId,
        accountName: acc.accountName,
        email: acc.email,
        phone: acc.phone,
        avatarUrl: acc.avatarUrl,
        clientId: acc.clientId ? `${acc.clientId.slice(0, 4)}...${acc.clientId.slice(-4)}` : null,
        isActive: acc.isActive,
        lastSyncAt: acc.lastSyncAt,
        tokenExpiresAt: acc.tokenExpiresAt,
        threadCount: acc._count.threads,
        unreadCount: totalUnread,
        createdAt: acc.createdAt,
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/olx/accounts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      accountName,
      email,
      phone,
      clientId,
      clientSecret,
      accessToken,
      refreshToken,
      expiresIn = 86400,
      isDemo = false,
    } = body;

    if (!accountName?.trim()) {
      return NextResponse.json({ error: "Название аккаунта обязательно" }, { status: 400 });
    }

    // Если это демо-аккаунт для быстрого тестирования интерфейса
    if (isDemo) {
      const demoAccount = await prisma.olxAccount.create({
        data: {
          accountName: accountName.trim(),
          email: email || "demo@olx-store.ua",
          phone: phone || "+380 (67) 123-45-67",
          avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          accessToken: "demo_token_" + Date.now(),
          refreshToken: "demo_refresh_" + Date.now(),
          tokenExpiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          isActive: true,
          lastSyncAt: new Date(),
        },
      });

      // Найдем несколько товаров из базы для связки
      const sampleProducts = await prisma.product.findMany({
        take: 3,
        include: { variants: true },
      });

      // Создаем 3 реалистичных диалога с историей
      const demoThreads = [
        {
          olxThreadId: "demo_th_1_" + Date.now(),
          advertTitle: sampleProducts[0]?.name || "Беспроводные наушники AirPods Pro 2 ANC",
          advertPrice: sampleProducts[0]?.variants[0]?.priceInUA || 2100,
          advertImage: sampleProducts[0]?.images[0] || "https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400&auto=format&fit=crop&q=80",
          interlocutorName: "Максим Шевченко",
          unreadCount: 1,
          lastMessageText: "Здравствуйте! Подскажите, есть в наличии? Можете отправить сегодня Новой Почтой?",
          linkedProductId: sampleProducts[0]?.id || null,
          linkedVariantId: sampleProducts[0]?.variants[0]?.id || null,
          buyerNotes: "Интересуется отправкой наложкой или OLX Доставкой, г. Киев, отделение #45",
          messages: [
            {
              senderName: "Максим Шевченко",
              isFromMe: false,
              text: "Добрый день! Данная модель актуальна?",
              sentAt: new Date(Date.now() - 3600 * 1000 * 3),
            },
            {
              senderName: "Вы",
              isFromMe: true,
              text: "Здравствуйте! Да, абсолютно новый запечатанный комплект.",
              sentAt: new Date(Date.now() - 3600 * 1000 * 2),
            },
            {
              senderName: "Максим Шевченко",
              isFromMe: false,
              text: "Здравствуйте! Подскажите, есть в наличии? Можете отправить сегодня Новой Почтой?",
              sentAt: new Date(Date.now() - 300 * 1000),
            },
          ],
        },
        {
          olxThreadId: "demo_th_2_" + Date.now(),
          advertTitle: sampleProducts[1]?.name || "Смарт-часы Ultra 2 Titanium 49mm",
          advertPrice: sampleProducts[1]?.variants[0]?.priceInUA || 1850,
          advertImage: sampleProducts[1]?.images[0] || "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&auto=format&fit=crop&q=80",
          interlocutorName: "Олена Ковальчук",
          unreadCount: 0,
          lastMessageText: "Дякую, оформила замовлення через OLX Доставку!",
          linkedProductId: sampleProducts[1]?.id || null,
          linkedVariantId: sampleProducts[1]?.variants[0]?.id || null,
          buyerNotes: "Оформила OLX доставку, Укрпошта",
          messages: [
            {
              senderName: "Олена Ковальчук",
              isFromMe: false,
              text: "Вітаю! Чи підійде ремінець на тонку руку?",
              sentAt: new Date(Date.now() - 3600 * 1000 * 12),
            },
            {
              senderName: "Вы",
              isFromMe: true,
              text: "Добрий день! Так, в комплекті регульований силіконовий ремінець Ocean Band, підходить ідеально.",
              sentAt: new Date(Date.now() - 3600 * 1000 * 10),
            },
            {
              senderName: "Олена Ковальчук",
              isFromMe: false,
              text: "Дякую, оформила замовлення через OLX Доставку!",
              sentAt: new Date(Date.now() - 3600 * 1000 * 8),
            },
          ],
        },
      ];

      for (const th of demoThreads) {
        const createdThread = await prisma.olxThread.create({
          data: {
            accountId: demoAccount.id,
            olxThreadId: th.olxThreadId,
            advertTitle: th.advertTitle,
            advertPrice: th.advertPrice,
            advertImage: th.advertImage,
            interlocutorName: th.interlocutorName,
            unreadCount: th.unreadCount,
            lastMessageText: th.lastMessageText,
            lastMessageAt: new Date(),
            linkedProductId: th.linkedProductId,
            linkedVariantId: th.linkedVariantId,
            buyerNotes: th.buyerNotes,
          },
        });

        for (const m of th.messages) {
          await prisma.olxMessage.create({
            data: {
              threadId: createdThread.id,
              senderName: m.senderName,
              isFromMe: m.isFromMe,
              text: m.text,
              sentAt: m.sentAt,
              isRead: true,
            },
          });
        }
      }

      return NextResponse.json({ success: true, account: demoAccount, isDemo: true });
    }

    // Если подключение с настоящими токенами
    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token обязателен для авторизации в OLX" },
        { status: 400 }
      );
    }

    let olxUser = null;
    try {
      olxUser = await OlxApiClient.getMe(accessToken);
    } catch (e) {
      console.warn("Could not fetch OLX user info with token:", e);
    }

    const tokenExpiresAt = expiresIn
      ? new Date(Date.now() + Number(expiresIn) * 1000)
      : new Date(Date.now() + 30 * 24 * 3600 * 1000);

    const account = await prisma.olxAccount.create({
      data: {
        accountName: accountName.trim(),
        email: email || olxUser?.email || null,
        phone: phone || olxUser?.phone || null,
        olxUserId: olxUser?.id ? String(olxUser.id) : null,
        avatarUrl: olxUser?.avatar || null,
        clientId: clientId?.trim() || null,
        clientSecret: clientSecret?.trim() || null,
        accessToken: accessToken.trim(),
        refreshToken: refreshToken?.trim() || null,
        tokenExpiresAt,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error("POST /api/olx/accounts error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
