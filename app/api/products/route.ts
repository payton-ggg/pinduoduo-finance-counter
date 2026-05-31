import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      variants: true,
      expenses: true,
      incomes: true,
      folder: true,
    },
  });
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const data = await req.json();
  const images: string[] = Array.isArray(data.images)
    ? (data.images as any[])
        .map((v) => (typeof v === "string" ? v : v?.url))
        .filter(Boolean)
    : typeof data.images === "string"
    ? [data.images]
    : [];

  const variants = Array.isArray(data.variants) ? data.variants : [];
  const firstVariant = variants[0] || data;

  const newProduct = await prisma.product.create({
    data: {
      name: data.name,
      images,
      pinduoduoUrl: data.pinduoduoUrl,
      folderId: data.folderId || null,
      variants: {
        create: variants.length > 0
          ? variants.map((v: any) => ({
              priceCNY: Number(v.priceCNY) || 0,
              priceInUA: v.priceInUA ?? null,
              netPrice: v.netPrice ?? null,
              weight: v.weight ?? null,
              pddSearchQuery: v.pddSearchQuery || null,
              sellsCount: v.sellsCount ?? null,
              purchasedCount: v.purchasedCount ?? 0,
              shippingUA: v.shippingUA ?? null,
              managementUAH: v.managementUAH ?? null,
              rateCNY: v.rateCNY ?? null,
              rateUSD: v.rateUSD ?? null,
              shippingType: v.shippingType || null,
              customShippingRate: v.customShippingRate ?? null,
            }))
          : [{
              priceCNY: Number(firstVariant.priceCNY) || 0,
              priceInUA: firstVariant.priceInUA ?? null,
              netPrice: firstVariant.netPrice ?? null,
              weight: firstVariant.weight ?? null,
              pddSearchQuery: firstVariant.pddSearchQuery || null,
              sellsCount: firstVariant.sellsCount ?? null,
              purchasedCount: firstVariant.purchasedCount ?? 0,
              shippingUA: firstVariant.shippingUA ?? null,
              managementUAH: firstVariant.managementUAH ?? null,
              rateCNY: firstVariant.rateCNY ?? null,
              rateUSD: firstVariant.rateUSD ?? null,
              shippingType: firstVariant.shippingType || null,
              customShippingRate: firstVariant.customShippingRate ?? null,
            }],
      },
    },
    include: { variants: true },
  });
  return NextResponse.json(newProduct);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.variant.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "Product deleted" });
}
