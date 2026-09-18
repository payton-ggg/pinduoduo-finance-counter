import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;
    const body = await req.json();
    const { title, text, category, shortcut, order } = body;

    const updated = await prisma.cannedResponse.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : undefined,
        text: text !== undefined ? text.trim() : undefined,
        category: category !== undefined ? category.trim() : undefined,
        shortcut: shortcut !== undefined ? (shortcut?.trim() || null) : undefined,
        order: order !== undefined ? Number(order) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT /api/olx/templates/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    await prisma.cannedResponse.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/olx/templates/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
