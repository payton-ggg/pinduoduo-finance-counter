import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const { folderId, name } = await req.json();

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!folderId || typeof folderId !== "string" || folderId.trim().length === 0) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
    }

    const sourceProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, folder: true },
    });

    if (!sourceProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (role === "restricted" && !sourceProduct.folder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied to source product" }, { status: 403 });
    }

    const destFolder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!destFolder) {
      return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
    }

    if (role === "restricted" && !destFolder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied to destination folder" }, { status: 403 });
    }

    // Create duplicate product with new name and selected folder
    const copiedProduct = await prisma.product.create({
      data: {
        name: name.trim(),
        images: sourceProduct.images,
        pinduoduoUrl: sourceProduct.pinduoduoUrl,
        folderId: folderId,
        variants: {
          create: sourceProduct.variants.map((v) => ({
            priceCNY: v.priceCNY,
            priceInUA: v.priceInUA,
            netPrice: v.netPrice,
            weight: v.weight,
            pddSearchQuery: v.pddSearchQuery,
            sellsCount: 0,
            purchasedCount: 0,
            shippingUA: v.shippingUA,
            managementUAH: v.managementUAH,
            rateCNY: v.rateCNY,
            rateUSD: v.rateUSD,
            shippingType: v.shippingType,
            customShippingRate: v.customShippingRate,
            isIncluded: v.isIncluded,
          })),
        },
      },
      include: { variants: true },
    });

    return NextResponse.json(copiedProduct);
  } catch (e) {
    console.error("Duplicate product failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
