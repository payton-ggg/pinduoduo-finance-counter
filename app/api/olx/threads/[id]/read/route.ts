import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OlxApiClient } from "@/lib/olx/client";
import { ensureValidToken } from "@/lib/olx/sync";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    const thread = await prisma.olxThread.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Тред не найден" }, { status: 404 });
    }

    // Если есть реальный аккаунт, уведомляем OLX API
    if (thread.account && !thread.account.accessToken.startsWith("demo_token_")) {
      try {
        const token = await ensureValidToken(thread.account);
        await OlxApiClient.markThreadAsRead(token, thread.olxThreadId);
      } catch (err) {
        console.warn("Could not mark thread as read on OLX API:", err);
      }
    }

    // Сбрасываем unreadCount
    await prisma.olxThread.update({
      where: { id: thread.id },
      data: { unreadCount: 0 },
    });

    // Отмечаем входящие сообщения как прочитанные
    await prisma.olxMessage.updateMany({
      where: { threadId: thread.id, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/olx/threads/[id]/read error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
