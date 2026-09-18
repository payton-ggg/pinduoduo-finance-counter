import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const IO_API_KEY = process.env.IO_NET || "";
const BASE_URL = "https://api.intelligence.io.solutions/api/v1";

export async function POST(req: Request) {
  try {
    const { threadId, prompt = "", tone = "friendly" } = await req.json();

    if (!threadId) {
      return NextResponse.json({ error: "threadId is required" }, { status: 400 });
    }

    const thread = await prisma.olxThread.findUnique({
      where: { id: threadId },
      include: {
        linkedProduct: {
          include: { variants: true },
        },
        linkedVariant: true,
        messages: {
          orderBy: { sentAt: "desc" },
          take: 6,
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    // Собираем историю переписки в хронологическом порядке
    const reversedMessages = [...thread.messages].reverse();
    const chatHistory = reversedMessages
      .map((m) => `${m.isFromMe ? "Продавец (мы)" : thread.interlocutorName || "Покупатель"}: ${m.text}`)
      .join("\n");

    const productName = thread.linkedProduct?.name || thread.advertTitle || "Товар";
    const variant = thread.linkedVariant || thread.linkedProduct?.variants[0];
    const price = thread.advertPrice || variant?.priceInUA || "указана в объявлении";
    const stock = variant ? Math.max(0, (variant.purchasedCount || 0) - (variant.sellsCount || 0)) : "в наличии";

    // Если настроен AI ключ, используем LLM
    if (IO_API_KEY) {
      try {
        const systemPrompt = `Ты — профессиональный, вежливый и продающий менеджер интернет-магазина на маркетплейсе OLX (Украина).
Твоя задача: составить идеальный, естественный и вежливый ответ покупателю на украинском или русском языке (в зависимости от языка покупателя).

Информация о товаре:
- Название товара: ${productName}
- Розничная цена: ${price} грн
- Остаток на складе: ${stock} шт.
- Имя покупателя: ${thread.interlocutorName || "Клиент"}

Стиль общения: ${tone === "short" ? "краткий и по делу" : tone === "business" ? "деловой и четкий" : "доброжелательный, приветливый и клиент-ориентированный"}.
${prompt ? `Дополнительное указание продавца: ${prompt}` : ""}

Важно:
1. Отвечай прямо текстом сообщения без кавычек, вводных слов вроде "Вот ваш ответ:" и без плейсхолдеров.
2. Не придумывай несуществующих скидок, если продавец прямо об этом не попросил.
3. Предлагай удобные способы доставки: Новая Почта, Укрпочта, OLX Доставка.`;

        const completionRes = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${IO_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            model: "mistralai/Mistral-Large-Instruct-2411",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `История диалога:\n${chatHistory || "Клиент интересуется объявлением."}\n\nСгенерируй лучший ответ продавца:` },
            ],
            stream: false,
          }),
        });

        if (completionRes.ok) {
          const completionData = await completionRes.json();
          let suggestion = completionData.choices?.[0]?.message?.content || "";
          suggestion = suggestion.replace(/^["']|["']$/g, "").trim();
          if (suggestion) {
            return NextResponse.json({ suggestion, source: "ai" });
          }
        }
      } catch (llmErr) {
        console.warn("LLM generation error, falling back to smart rules:", llmErr);
      }
    }

    // Качественный фоллбэк / Smart Rule generator
    const lastMsg = thread.messages[0]?.text?.toLowerCase() || "";
    let smartReply = "";

    const isUkr = /[іїєґ]/.test(lastMsg) || /[іїєґ]/.test(thread.advertTitle || "");

    if (lastMsg.includes("наличи") || lastMsg.includes("є") || lastMsg.includes("актуальн") || lastMsg.includes("в наличии")) {
      smartReply = isUkr
        ? `Вітаю${thread.interlocutorName ? `, ${thread.interlocutorName}` : ""}! Так, ${productName} є в наявності. Повністю новий комплект. Можемо відправити сьогодні через OLX Доставку або Новою Поштою!`
        : `Здравствуйте${thread.interlocutorName ? `, ${thread.interlocutorName}` : ""}! Да, ${productName} в наличии, абсолютно новый комплект. Можем отправить сегодня через OLX Доставку или Новой Почтой!`;
    } else if (lastMsg.includes("торг") || lastMsg.includes("скидк") || lastMsg.includes("дешев")) {
      smartReply = isUkr
        ? `Ціна ${price} грн остаточна, оскільки це мінімальна вартість за оригінальну якість. Але при замовленні від 2-х штук зробимо знижку або безкоштовну доставку!`
        : `Цена ${price} грн окончательная, так как это минимальная стоимость за проверенное качество. Но при заказе от 2-х единиц сделаем скидку или бесплатную доставку!`;
    } else if (lastMsg.includes("отправ") || lastMsg.includes("доставк") || lastMsg.includes("почт") || lastMsg.includes("пошт")) {
      smartReply = isUkr
        ? `Відправляємо щодня Новою Поштою та Укрпоштою. Найзручніше та найбезпечніше оформити через кнопку «Купити з доставкою» на сторінці оголошення.`
        : `Отправляем каждый день Новой Почтой и Укрпочтой. Удобнее и безопаснее всего оформить через OLX Доставку прямо в объявлении!`;
    } else {
      smartReply = isUkr
        ? `Вітаю${thread.interlocutorName ? `, ${thread.interlocutorName}` : ""}! ${productName} в наявності за ціною ${price} грн. Підкажіть, який спосіб доставки для вас буде найзручнішим?`
        : `Здравствуйте${thread.interlocutorName ? `, ${thread.interlocutorName}` : ""}! ${productName} в наличии по цене ${price} грн. Подскажите, какой вариант доставки для вас удобнее?`;
    }

    return NextResponse.json({ suggestion: smartReply, source: "smart-template" });
  } catch (error: any) {
    console.error("POST /api/olx/ai/suggest error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
