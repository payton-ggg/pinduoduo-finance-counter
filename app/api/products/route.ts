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
      images: data.images,
      olxUrl: data.olxUrl,
      pinduoduoUrl: data.pinduoduoUrl,
      priceUAH: data.priceUAH,
      workModalWindowIOS: data.workModalWindowIOS,
      soundReducer: data.soundReducer,
    },
  });
  return NextResponse.json(newProduct);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.product.delete({
    where: {
      id,
    },
  });
  return NextResponse.json({ message: "Product deleted" });
}
