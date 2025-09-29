import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { incomes: true, expenses: true },
    });
    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const { id } = await context.params;

  try {
    const data = await req.json();
    // Normalize images for Prisma String[] update
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
        olxUrl: data.olxUrl,
        pinduoduoUrl: data.pinduoduoUrl,
        priceCNY: data.priceCNY,
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
    return NextResponse.json(updated);
  } catch (e) {
    console.log("PATCH id:", id, "error:", e);
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
  const { id } = await context.params;

  try {
    // Ensure related records are removed first to avoid FK violations
    await prisma.expense.deleteMany({ where: { productId: id } });
    await prisma.income.deleteMany({ where: { productId: id } });
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
