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
  // Normalize images to string[] for create
  const images: string[] = Array.isArray(data.images)
    ? (data.images as any[])
        .map((v) => (typeof v === "string" ? v : v?.url))
        .filter(Boolean)
    : typeof data.images === "string"
    ? [data.images]
    : [];

  const newProduct = await prisma.product.create({
    data: {
      name: data.name,
      images,
      olxUrl: data.olxUrl,
      pinduoduoUrl: data.pinduoduoUrl,
      priceCNY: data.priceCNY,
      shippingUA: data.shippingCNY,
      workModalWindowIOS: data.workModalWindowIOS,
      soundReducer: data.soundReducer,
      sensesOfEar: data.sensesOfEar,
      wirelessCharger: data.wirelessCharger,
      gyroscope: data.gyroscope,
      weight: data.weight,
      microphoneQuality: data.microphoneQuality,
      sellsCount: data.sellsCount,
      purchasedCount: data.purchasedCount,
      chip: data.chip,
      equipment: data.equipment,
      priceInUA: data.priceInUA,
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
