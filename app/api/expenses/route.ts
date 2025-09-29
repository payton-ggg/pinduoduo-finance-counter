import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const expenses = await prisma.expense.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const data = await req.json();
  const created = await prisma.expense.create({
    data: {
      productId: data.productId,
      amount: data.amount,
      type: data.type,
    },
  });
  return NextResponse.json(created);
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const updated = await prisma.expense.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
      type: data.type,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ message: "Expense deleted" });
}
