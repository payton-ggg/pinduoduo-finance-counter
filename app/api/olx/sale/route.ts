import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      threadId,
      productId,
      variantId,
      amount,
      quantity = 1,
      customerName,
      customerPhone,
      note,
    } = body;

    if (!productId || amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "productId и amount обязательны для фиксации продажи" },
        { status: 400 }
      );
    }

    const saleAmount = Number(amount);
    const saleQty = Math.max(1, Number(quantity) || 1);

    // 1. Создаем запись дохода в базе
    const income = await prisma.income.create({
      data: {
        productId,
        amount: saleAmount,
      },
    });

    // 2. Увеличиваем количество продаж (sellsCount) у варианта
    let targetVariantId = variantId;
    if (!targetVariantId) {
      const firstVar = await prisma.variant.findFirst({
        where: { productId },
        orderBy: { createdAt: "asc" },
      });
      targetVariantId = firstVar?.id;
    }

    if (targetVariantId) {
      await prisma.variant.update({
        where: { id: targetVariantId },
        data: {
          sellsCount: {
            increment: saleQty,
          },
        },
      });
    }

    // 3. Если есть threadId, обновляем заметки и связку
    if (threadId) {
      const saleDate = new Date().toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });

      const thread = await prisma.olxThread.findUnique({
        where: { id: threadId },
      });

      const saleNoteTag = `✅ Продажа: ${saleAmount} грн (${saleQty} шт.) [${saleDate}]${note ? ` — ${note}` : ""}`;
      const updatedNotes = thread?.buyerNotes
        ? `${thread.buyerNotes}\n${saleNoteTag}`
        : saleNoteTag;

      await prisma.olxThread.update({
        where: { id: threadId },
        data: {
          linkedProductId: productId,
          linkedVariantId: targetVariantId || undefined,
          buyerNotes: updatedNotes,
        },
      });
    }

    return NextResponse.json({
      success: true,
      income,
      saleAmount,
      quantity: saleQty,
    });
  } catch (error: any) {
    console.error("POST /api/olx/sale error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
