import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, incomes: true, expenses: true, folder: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (role === "restricted" && !product.folder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(product);
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const data = await req.json();

    if (data.folderId !== undefined && (!data.folderId || typeof data.folderId !== "string" || data.folderId.trim().length === 0)) {
      return NextResponse.json({ error: "Folder ID is required" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (role === "restricted" && !existing.folder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    if (data.folderId !== undefined && data.folderId !== existing.folderId) {
      const destFolder = await prisma.folder.findUnique({ where: { id: data.folderId } });
      if (!destFolder) {
        return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
      }
      if (role === "restricted" && !destFolder.allowedForSecondPassword) {
        return NextResponse.json({ error: "Access denied to destination folder" }, { status: 403 });
      }
    }

    let imagesUpdate: { set: string[] } | undefined;
    if (Array.isArray(data.images)) {
      const urls = (data.images as any[])
        .map((v) => (typeof v === "string" ? v : v?.url))
        .filter(Boolean);
      imagesUpdate = { set: urls };
    } else if (typeof data.images === "string") {
      imagesUpdate = { set: [data.images] };
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        images: imagesUpdate,
        pinduoduoUrl: data.pinduoduoUrl,
        archive: data.archive,
        folderId: data.folderId !== undefined ? data.folderId : undefined,
      },
    });

    if (Array.isArray(data.variants)) {
      for (const v of data.variants) {
        if (v.id) {
          await prisma.variant.update({
            where: { id: v.id },
            data: {
              priceCNY: v.priceCNY !== undefined ? Number(v.priceCNY) : undefined,
              priceInUA: v.priceInUA !== undefined ? v.priceInUA : undefined,
              netPrice: v.netPrice !== undefined ? v.netPrice : undefined,
              weight: v.weight !== undefined ? v.weight : undefined,
              pddSearchQuery: v.pddSearchQuery !== undefined ? v.pddSearchQuery : undefined,
              sellsCount: v.sellsCount !== undefined ? v.sellsCount : undefined,
              purchasedCount: v.purchasedCount !== undefined ? v.purchasedCount : undefined,
              shippingUA: v.shippingUA !== undefined ? v.shippingUA : undefined,
              managementUAH: v.managementUAH !== undefined ? v.managementUAH : undefined,
              rateCNY: v.rateCNY !== undefined ? v.rateCNY : undefined,
              rateUSD: v.rateUSD !== undefined ? v.rateUSD : undefined,
              shippingType: v.shippingType !== undefined ? v.shippingType : undefined,
              customShippingRate: v.customShippingRate !== undefined ? v.customShippingRate : undefined,
              isIncluded: v.isIncluded !== undefined ? v.isIncluded : undefined,
            },
          });
        } else {
          await prisma.variant.create({
            data: {
              productId: id,
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
            },
          });
        }
      }

      if (data.deletedVariantIds && Array.isArray(data.deletedVariantIds)) {
        await prisma.variant.deleteMany({
          where: { id: { in: data.deletedVariantIds } },
        });
      }
    }

    const result = await prisma.product.findUnique({
      where: { id },
      include: { variants: true, incomes: true, expenses: true, folder: true },
    });

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const existing = await prisma.product.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (role === "restricted" && !existing.folder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.expense.deleteMany({ where: { productId: id } });
    await prisma.income.deleteMany({ where: { productId: id } });
    await prisma.variant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ message: "Product deleted" });
  } catch (e) {
    console.error("DELETE /api/products/[id] failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
