import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function POST(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids, folderId } = await req.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid ids array" },
        { status: 400 }
      );
    }

    if (!folderId || typeof folderId !== "string" || folderId.trim().length === 0) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      );
    }

    // Check destination folder access
    const destFolder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!destFolder) {
      return NextResponse.json({ error: "Destination folder not found" }, { status: 404 });
    }
    if (role === "restricted" && !destFolder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied to destination folder" }, { status: 403 });
    }

    // Check access to products being moved
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
        return NextResponse.json({ error: "Access denied to some source products" }, { status: 403 });
      }
    }

    await prisma.product.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        folderId: folderId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Bulk folder error:", error);
    return NextResponse.json(
      { error: "Failed to update products" },
      { status: 500 }
    );
  }
}
