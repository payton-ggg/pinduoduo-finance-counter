import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const updates: Array<{
      id: string;
      priceCNY?: number;
      priceInUA?: number;
      netPrice?: number;
      weight?: number;
      sellsCount?: number;
      purchasedCount?: number;
      shippingUA?: number;
      managementUAH?: number;
      rateCNY?: number;
      rateUSD?: number;
      isIncluded?: boolean;
    }> = body.updates;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    // If restricted role, verify access to products
    if (role === "restricted") {
      const variantIds = updates.map((u) => u.id);
      const variants = await prisma.variant.findMany({
        where: { id: { in: variantIds } },
        include: { product: { include: { folder: true } } },
      });

      for (const v of variants) {
        if (!v.product.folder.allowedForSecondPassword) {
          return NextResponse.json(
            { error: `Access denied for variant ${v.id}` },
            { status: 403 }
          );
        }
      }
    }

    // Execute all updates inside a single batched transaction
    const updatePromises = updates.map((item) => {
      const { id, ...data } = item;
      return prisma.variant.update({
        where: { id },
        data: {
          priceCNY:
            data.priceCNY !== undefined
              ? Number(data.priceCNY)
              : undefined,
          priceInUA:
            data.priceInUA !== undefined
              ? data.priceInUA !== null
                ? Number(data.priceInUA)
                : null
              : undefined,
          netPrice:
            data.netPrice !== undefined
              ? data.netPrice !== null
                ? Number(data.netPrice)
                : null
              : undefined,
          weight:
            data.weight !== undefined
              ? data.weight !== null
                ? Number(data.weight)
                : null
              : undefined,
          sellsCount:
            data.sellsCount !== undefined
              ? data.sellsCount !== null
                ? Number(data.sellsCount)
                : null
              : undefined,
          purchasedCount:
            data.purchasedCount !== undefined
              ? data.purchasedCount !== null
                ? Number(data.purchasedCount)
                : null
              : undefined,
          shippingUA:
            data.shippingUA !== undefined
              ? data.shippingUA !== null
                ? Number(data.shippingUA)
                : null
              : undefined,
          managementUAH:
            data.managementUAH !== undefined
              ? data.managementUAH !== null
                ? Number(data.managementUAH)
                : null
              : undefined,
          rateCNY:
            data.rateCNY !== undefined
              ? data.rateCNY !== null
                ? Number(data.rateCNY)
                : null
              : undefined,
          rateUSD:
            data.rateUSD !== undefined
              ? data.rateUSD !== null
                ? Number(data.rateUSD)
                : null
              : undefined,
          isIncluded:
            data.isIncluded !== undefined ? Boolean(data.isIncluded) : undefined,
        },
      });
    });

    const updatedVariants = await prisma.$transaction(updatePromises);

    return NextResponse.json({
      success: true,
      updatedCount: updatedVariants.length,
      variants: updatedVariants,
    });
  } catch (e) {
    console.error("Bulk update variants failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Server error" },
      { status: 500 }
    );
  }
}
