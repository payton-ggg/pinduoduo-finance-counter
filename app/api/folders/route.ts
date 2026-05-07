import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const folders = await prisma.folder.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const folder = await prisma.folder.create({
    data: { name: name.trim() },
  });
  return NextResponse.json(folder);
}

export async function PATCH(req: Request) {
  const { id, name } = await req.json();
  if (!id || !name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "ID and name are required" }, { status: 400 });
  }
  const folder = await prisma.folder.update({
    where: { id },
    data: { name: name.trim() },
  });
  return NextResponse.json(folder);
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }
  await prisma.product.updateMany({
    where: { folderId: id },
    data: { folderId: null },
  });
  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
