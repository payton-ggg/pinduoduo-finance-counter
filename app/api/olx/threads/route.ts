import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const search = searchParams.get("search")?.trim().toLowerCase();
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const archived = searchParams.get("archived") === "true";
    const favoritesOnly = searchParams.get("favoritesOnly") === "true";

    const where: any = {
      isArchived: archived,
    };

    if (accountId && accountId !== "all") {
      where.accountId = accountId;
    }

    if (unreadOnly) {
      where.unreadCount = { gt: 0 };
    }

    if (favoritesOnly) {
      where.isFavorite = true;
    }

    if (search) {
      where.OR = [
        { interlocutorName: { contains: search, mode: "insensitive" } },
        { advertTitle: { contains: search, mode: "insensitive" } },
        { lastMessageText: { contains: search, mode: "insensitive" } },
        { buyerNotes: { contains: search, mode: "insensitive" } },
      ];
    }

    const threads = await prisma.olxThread.findMany({
      where,
      orderBy: [
        { unreadCount: "desc" },
        { lastMessageAt: "desc" },
        { updatedAt: "desc" },
      ],
      include: {
        account: {
          select: {
            id: true,
            accountName: true,
            avatarUrl: true,
            isActive: true,
          },
        },
        linkedProduct: {
          include: {
            variants: {
              where: { isIncluded: true },
            },
          },
        },
        linkedVariant: true,
      },
    });

    return NextResponse.json(threads);
  } catch (error: any) {
    console.error("GET /api/olx/threads error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
