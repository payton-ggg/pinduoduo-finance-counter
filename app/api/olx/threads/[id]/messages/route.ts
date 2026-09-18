import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OlxApiClient } from "@/lib/olx/client";
import { ensureValidToken } from "@/lib/olx/sync";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    const messages = await prisma.olxMessage.findMany({
      where: { threadId: id },
      orderBy: { sentAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error("GET /api/olx/threads/[id]/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;
    const body = await req.json();
    const { text, attachments = [] } = body;

    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Текст сообщения или вложение обязательно" }, { status: 400 });
    }

    const thread = await prisma.olxThread.findUnique({
      where: { id },
      include: { account: true },
    });

    if (!thread) {
      return NextResponse.json({ error: "Тред не найден" }, { status: 404 });
    }

    let olxMessageId: string | null = null;

    // Если это не демо-токен, пробуем отправить через реальный OLX API
    if (thread.account && !thread.account.accessToken.startsWith("demo_token_")) {
      try {
        const token = await ensureValidToken(thread.account);
        const sendResult = await OlxApiClient.sendMessage(token, thread.olxThreadId, {
          text: text.trim(),
          attachments,
        });
        if (sendResult?.id) {
          olxMessageId = String(sendResult.id);
        }
      } catch (apiError: any) {
        console.warn("OLX API sendMessage warning:", apiError.message);
        // Не блокируем сохранение, чтобы пользователь не потерял набранный текст
      }
    }

    const newMessage = await prisma.olxMessage.create({
      data: {
        threadId: thread.id,
        olxMessageId: olxMessageId || `local_${Date.now()}`,
        senderName: "Вы",
        isFromMe: true,
        text: text.trim(),
        attachments,
        isRead: true,
        sentAt: new Date(),
      },
    });

    // Обновляем тред
    await prisma.olxThread.update({
      where: { id: thread.id },
      data: {
        lastMessageText: text.trim(),
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
    });

    return NextResponse.json(newMessage);
  } catch (error: any) {
    console.error("POST /api/olx/threads/[id]/messages error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
