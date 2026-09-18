import { prisma } from "@/lib/prisma";
import { OlxApiClient } from "./client";

/**
 * Обеспечивает валидный токен (обновляет через refresh_token при необходимости)
 */
export async function ensureValidToken(account: {
  id: string;
  clientId: string | null;
  clientSecret: string | null;
  accessToken: string;
  refreshToken: string | null;
  tokenExpiresAt: Date | null;
}): Promise<string> {
  const isExpiring =
    account.tokenExpiresAt &&
    new Date(account.tokenExpiresAt).getTime() - Date.now() < 5 * 60 * 1000;

  if (isExpiring && account.refreshToken && account.clientId && account.clientSecret) {
    try {
      const refreshed = await OlxApiClient.refreshAccessToken({
        clientId: account.clientId,
        clientSecret: account.clientSecret,
        refreshToken: account.refreshToken,
      });

      const newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000);

      await prisma.olxAccount.update({
        where: { id: account.id },
        data: {
          accessToken: refreshed.access_token,
          refreshToken: refreshed.refresh_token || account.refreshToken,
          tokenExpiresAt: newExpiresAt,
        },
      });

      return refreshed.access_token;
    } catch (err) {
      console.error(`Failed to refresh token for account ${account.id}:`, err);
    }
  }

  return account.accessToken;
}

/**
 * Попытка автоматически привязать тред к товару в каталоге
 */
async function findMatchingProduct(title?: string | null) {
  if (!title || !title.trim()) return null;

  const cleanTitle = title.toLowerCase().trim();
  const products = await prisma.product.findMany({
    include: { variants: true },
    take: 50,
  });

  // 1. Точное или частичное совпадение по названию товара
  for (const product of products) {
    const prodName = product.name.toLowerCase();
    if (cleanTitle.includes(prodName) || prodName.includes(cleanTitle)) {
      return {
        productId: product.id,
        variantId: product.variants[0]?.id || null,
      };
    }
  }

  // 2. Совпадение по pddSearchQuery вариантов
  for (const product of products) {
    for (const variant of product.variants) {
      if (variant.pddSearchQuery) {
        const q = variant.pddSearchQuery.toLowerCase();
        if (cleanTitle.includes(q) || q.includes(cleanTitle)) {
          return {
            productId: product.id,
            variantId: variant.id,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Синхронизировать конкретный аккаунт OLX (треды и сообщения)
 */
export async function syncAccount(accountId: string) {
  const account = await prisma.olxAccount.findUnique({
    where: { id: accountId },
  });

  if (!account || !account.isActive) {
    return { success: false, error: "Account not found or inactive" };
  }

  try {
    const token = await ensureValidToken(account);
    const threads = await OlxApiClient.getThreads(token, { limit: 50 });

    for (const threadData of threads) {
      const olxThreadId = String(threadData.id);

      // Ищем существующий тред
      let existingThread = await prisma.olxThread.findUnique({
        where: {
          accountId_olxThreadId: {
            accountId: account.id,
            olxThreadId,
          },
        },
      });

      let linkedProductId = existingThread?.linkedProductId || null;
      let linkedVariantId = existingThread?.linkedVariantId || null;

      // Если товар еще не привязан, пробуем авто-линковку
      if (!linkedProductId && threadData.item_title) {
        const match = await findMatchingProduct(threadData.item_title);
        if (match) {
          linkedProductId = match.productId;
          linkedVariantId = match.variantId;
        }
      }

      // Сохраняем/обновляем тред
      const thread = await prisma.olxThread.upsert({
        where: {
          accountId_olxThreadId: {
            accountId: account.id,
            olxThreadId,
          },
        },
        create: {
          accountId: account.id,
          olxThreadId,
          advertId: threadData.advert_id ? String(threadData.advert_id) : null,
          advertTitle: threadData.item_title || "Объявление OLX",
          advertUrl: threadData.item_url || null,
          advertPrice: threadData.item_price ? Number(threadData.item_price) : null,
          interlocutorId: threadData.interlocutor_id ? String(threadData.interlocutor_id) : null,
          interlocutorName: threadData.interlocutor_name || "Покупатель",
          unreadCount: threadData.unread_count || 0,
          lastMessageText: threadData.last_message?.text || null,
          lastMessageAt: threadData.last_message?.created_at
            ? new Date(threadData.last_message.created_at)
            : new Date(),
          linkedProductId,
          linkedVariantId,
        },
        update: {
          unreadCount: threadData.unread_count || 0,
          advertTitle: threadData.item_title || undefined,
          advertUrl: threadData.item_url || undefined,
          advertPrice: threadData.item_price ? Number(threadData.item_price) : undefined,
          interlocutorName: threadData.interlocutor_name || undefined,
          lastMessageText: threadData.last_message?.text || undefined,
          lastMessageAt: threadData.last_message?.created_at
            ? new Date(threadData.last_message.created_at)
            : undefined,
          linkedProductId: linkedProductId || undefined,
          linkedVariantId: linkedVariantId || undefined,
        },
      });

      // Синхронизируем сообщения для треда
      try {
        const messages = await OlxApiClient.getThreadMessages(token, olxThreadId, { limit: 50 });

        for (const msg of messages) {
          const msgId = msg.id ? String(msg.id) : null;
          const sentAt = msg.created_at ? new Date(msg.created_at) : new Date();

          if (msgId) {
            const existingMsg = await prisma.olxMessage.findFirst({
              where: {
                threadId: thread.id,
                olxMessageId: msgId,
              },
            });

            if (!existingMsg) {
              await prisma.olxMessage.create({
                data: {
                  threadId: thread.id,
                  olxMessageId: msgId,
                  senderId: msg.user_id ? String(msg.user_id) : null,
                  isFromMe: Boolean(msg.is_from_me),
                  text: msg.text || "",
                  attachments: msg.attachments?.map((a) => a.url) || [],
                  sentAt,
                },
              });
            }
          }
        }
      } catch (msgErr) {
        console.warn(`Failed to fetch messages for thread ${olxThreadId}:`, msgErr);
      }
    }

    await prisma.olxAccount.update({
      where: { id: account.id },
      data: { lastSyncAt: new Date() },
    });

    return { success: true, count: threads.length };
  } catch (err: any) {
    console.error(`Sync error for account ${accountId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Синхронизировать все активные аккаунты
 */
export async function syncAllAccounts() {
  const accounts = await prisma.olxAccount.findMany({
    where: { isActive: true },
  });

  const results = await Promise.allSettled(
    accounts.map((acc) => syncAccount(acc.id))
  );

  return results;
}
