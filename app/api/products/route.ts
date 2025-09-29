import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      expenses: true,
      incomes: true,
    },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const data = await req.json();
  const newProduct = await prisma.product.create({
    data: {
      name: data.name,
      imageUrl: data.imageUrl,
    },
  });
  return NextResponse.json(newProduct);
}
