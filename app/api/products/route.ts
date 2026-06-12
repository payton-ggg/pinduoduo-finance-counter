import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function GET() {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const products = await prisma.product.findMany({
    where: role === "restricted" ? { folder: { allowedForSecondPassword: true } } : undefined,
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
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  if (!data.folderId || typeof data.folderId !== "string" || data.folderId.trim().length === 0) {
    return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
  }

  // Verify folder access
  const folder = await prisma.folder.findUnique({ where: { id: data.folderId } });
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }
  if (role === "restricted" && !folder.allowedForSecondPassword) {
    return NextResponse.json({ error: "Access denied to folder" }, { status: 403 });
  }

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
      folderId: data.folderId,
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
              isIncluded: v.isIncluded ?? true,
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
              isIncluded: firstVariant.isIncluded ?? true,
            }],
      },
    },
    include: { variants: true },
  });
  return NextResponse.json(newProduct);
}

export async function DELETE(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const product = await prisma.product.findUnique({
    where: { id },
    include: { folder: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }

  if (role === "restricted" && !product.folder.allowedForSecondPassword) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  await prisma.variant.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ message: "Product deleted" });
}
