import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;

    const thread = await prisma.olxThread.findUnique({
      where: { id },
      include: {
        account: true,
        linkedProduct: {
          include: {
            variants: true,
          },
        },
        linkedVariant: true,
        messages: {
          orderBy: { sentAt: "asc" },
        },
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Thread not found" }, { status: 404 });
    }

    return NextResponse.json(thread);
  } catch (error: any) {
    console.error("GET /api/olx/threads/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;
    const body = await req.json();
    const {
      linkedProductId,
      linkedVariantId,
      buyerNotes,
      isFavorite,
      isArchived,
      unreadCount,
    } = body;

    const updated = await prisma.olxThread.update({
      where: { id },
      data: {
        linkedProductId: linkedProductId !== undefined ? linkedProductId : undefined,
        linkedVariantId: linkedVariantId !== undefined ? linkedVariantId : undefined,
        buyerNotes: buyerNotes !== undefined ? buyerNotes : undefined,
        isFavorite: isFavorite !== undefined ? Boolean(isFavorite) : undefined,
        isArchived: isArchived !== undefined ? Boolean(isArchived) : undefined,
        unreadCount: unreadCount !== undefined ? Number(unreadCount) : undefined,
      },
      include: {
        account: true,
        linkedProduct: {
          include: {
            variants: true,
          },
        },
        linkedVariant: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PATCH /api/olx/threads/[id] error:", error);
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

    await prisma.olxThread.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/olx/threads/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
