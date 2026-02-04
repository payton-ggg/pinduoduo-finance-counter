import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { ids, archive } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid ids array" },
        { status: 400 }
      );
    }

    await prisma.product.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        archive: archive,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk archive error:", error);
    return NextResponse.json(
      { error: "Failed to update products" },
      { status: 500 }
    );
  }
}
