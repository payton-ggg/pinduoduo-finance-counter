import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    console.log("Incoming OLX Webhook event:", JSON.stringify(payload));

    const { event, data } = payload;

    if (event === "message.created" && data) {
      const { thread_id, id, text, user_id, created_at, attachments } = data;

      const thread = await prisma.olxThread.findFirst({
        where: { olxThreadId: String(thread_id) },
      });

      if (thread) {
        const msgId = String(id || Date.now());
        const existing = await prisma.olxMessage.findFirst({
          where: { threadId: thread.id, olxMessageId: msgId },
        });

        if (!existing) {
          await prisma.olxMessage.create({
            data: {
              threadId: thread.id,
              olxMessageId: msgId,
              senderId: user_id ? String(user_id) : null,
              isFromMe: false,
              text: text || "",
              attachments: attachments || [],
              sentAt: created_at ? new Date(created_at) : new Date(),
              isRead: false,
            },
          });

          await prisma.olxThread.update({
            where: { id: thread.id },
            data: {
              lastMessageText: text || "",
              lastMessageAt: created_at ? new Date(created_at) : new Date(),
              unreadCount: { increment: 1 },
            },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("OLX Webhook processing error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "OLX Webhook receiver is active" });
}
