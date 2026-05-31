import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();
  const variant = await prisma.variant.create({
    data: {
      productId: data.productId,
      priceCNY: Number(data.priceCNY) || 0,
      priceInUA: data.priceInUA ?? null,
      netPrice: data.netPrice ?? null,
      weight: data.weight ?? null,
      pddSearchQuery: data.pddSearchQuery || null,
      sellsCount: data.sellsCount ?? null,
      purchasedCount: data.purchasedCount ?? 0,
      shippingUA: data.shippingUA ?? null,
      managementUAH: data.managementUAH ?? null,
      rateCNY: data.rateCNY ?? null,
      rateUSD: data.rateUSD ?? null,
      shippingType: data.shippingType || null,
      customShippingRate: data.customShippingRate ?? null,
    },
  });
  return NextResponse.json(variant);
}

export async function PATCH(req: Request) {
  const data = await req.json();
  const { id, ...rest } = data;
  const variant = await prisma.variant.update({
    where: { id },
    data: {
      priceCNY: rest.priceCNY !== undefined ? Number(rest.priceCNY) : undefined,
      priceInUA: rest.priceInUA !== undefined ? rest.priceInUA : undefined,
      netPrice: rest.netPrice !== undefined ? rest.netPrice : undefined,
      weight: rest.weight !== undefined ? rest.weight : undefined,
      pddSearchQuery: rest.pddSearchQuery !== undefined ? rest.pddSearchQuery : undefined,
      sellsCount: rest.sellsCount !== undefined ? rest.sellsCount : undefined,
      purchasedCount: rest.purchasedCount !== undefined ? rest.purchasedCount : undefined,
      shippingUA: rest.shippingUA !== undefined ? rest.shippingUA : undefined,
      managementUAH: rest.managementUAH !== undefined ? rest.managementUAH : undefined,
      rateCNY: rest.rateCNY !== undefined ? rest.rateCNY : undefined,
      rateUSD: rest.rateUSD !== undefined ? rest.rateUSD : undefined,
      shippingType: rest.shippingType !== undefined ? rest.shippingType : undefined,
      customShippingRate: rest.customShippingRate !== undefined ? rest.customShippingRate : undefined,
    },
  });
  return NextResponse.json(variant);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.variant.delete({ where: { id } });
  return NextResponse.json({ message: "Variant deleted" });
}
