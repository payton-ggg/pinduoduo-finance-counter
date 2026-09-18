import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const DEFAULT_TEMPLATES = [
  {
    title: "В наличии / Готов к отправке",
    category: "Наличие",
    shortcut: "/nal",
    text: "Здравствуйте! Да, товар в наличии, новый и полностью проверен. Можем отправить сегодня Новой Почтой или OLX Доставкой!",
    order: 1,
  },
  {
    title: "Оформление OLX Доставки",
    category: "Доставка",
    shortcut: "/olx",
    text: "Вы можете оформить безопасную сделку через кнопку «Купить с доставкой» прямо в этом объявлении (Новая Почта / Укрпочта). Отправим в день заказа!",
    order: 2,
  },
  {
    title: "Реквизиты для оплаты (IBAN/Карта)",
    category: "Оплата",
    shortcut: "/pay",
    text: "Реквизиты для оплаты:\nФОП / Карта Приват/Моно:\nПолучатель: ...\nПосле оплаты напишите, пожалуйста, точное время и данные получателя для отправки.",
    order: 3,
  },
  {
    title: "Данные для отправки наложкой",
    category: "Доставка",
    shortcut: "/nalogka",
    text: "Для отправки наложенным платежом укажите:\n1. Город\n2. Номер отделения Новой Почты\n3. ФИО получателя\n4. Номер телефона",
    order: 4,
  },
  {
    title: "Скидка на комплект / опт",
    category: "Скидки",
    shortcut: "/sale",
    text: "При заказе от 2-х единиц сделаем приятную скидку 10% или бесплатную доставку! Какой цвет/комплектацию бронировать для вас?",
    order: 5,
  },
];

export async function GET() {
  try {
    let templates = await prisma.cannedResponse.findMany({
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    });

    // Если шаблонов еще нет, создаем дефолтные
    if (templates.length === 0) {
      for (const t of DEFAULT_TEMPLATES) {
        await prisma.cannedResponse.create({ data: t });
      }
      templates = await prisma.cannedResponse.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      });
    }

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("GET /api/olx/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, text, category = "Общие", shortcut, order = 0 } = body;

    if (!title?.trim() || !text?.trim()) {
      return NextResponse.json({ error: "Заголовок и текст шаблона обязательны" }, { status: 400 });
    }

    const template = await prisma.cannedResponse.create({
      data: {
        title: title.trim(),
        text: text.trim(),
        category: category?.trim() || "Общие",
        shortcut: shortcut?.trim() || null,
        order: Number(order) || 0,
      },
    });

    return NextResponse.json(template);
  } catch (error: any) {
    console.error("POST /api/olx/templates error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
