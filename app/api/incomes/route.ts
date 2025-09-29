import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const incomes = await prisma.income.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const data = await req.json();
  const created = await prisma.income.create({
    data: {
      productId: data.productId,
      amount: data.amount,
    },
  });
  return NextResponse.json(created);
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const updated = await prisma.income.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ message: "Income deleted" });
}
