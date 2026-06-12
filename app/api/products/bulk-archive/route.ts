import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function POST(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, archive } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid ids array" },
        { status: 400 }
      );
    }

    // Verify access to products
    if (role === "restricted") {
      const allowedProductsCount = await prisma.product.count({
        where: {
          id: { in: ids },
          folder: {
            allowedForSecondPassword: true,
          },
        },
      });
      if (allowedProductsCount !== ids.length) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
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
