import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export async function GET() {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const folders = await prisma.folder.findMany({
    where: role === "restricted" ? { allowedForSecondPassword: true } : undefined,
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { order: "asc" },
  });
  return NextResponse.json(folders);
}

export async function POST(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name } = await req.json();
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const maxOrder = await prisma.folder.aggregate({ _max: { order: true } });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;
  const folder = await prisma.folder.create({
    data: { 
      name: name.trim(), 
      order: nextOrder,
      allowedForSecondPassword: role === "restricted" ? true : false,
    },
  });
  return NextResponse.json(folder);
}

export async function PUT(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderedIds } = await req.json();
  if (!Array.isArray(orderedIds)) {
    return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 });
  }

  if (role === "restricted") {
    const foldersCount = await prisma.folder.count({
      where: {
        id: { in: orderedIds },
        allowedForSecondPassword: true,
      },
    });
    if (foldersCount !== orderedIds.length) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  await prisma.$transaction(
    orderedIds.map((id: string, index: number) =>
      prisma.folder.update({ where: { id }, data: { order: index } }),
    ),
  );
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, name, allowedForSecondPassword } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  if (role === "restricted" && !folder.allowedForSecondPassword) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const data: any = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }
    data.name = name.trim();
  }
  if (allowedForSecondPassword !== undefined) {
    if (role !== "admin") {
      return NextResponse.json({ error: "Only admin can toggle visibility" }, { status: 403 });
    }
    data.allowedForSecondPassword = Boolean(allowedForSecondPassword);
  }

  const updated = await prisma.folder.update({
    where: { id },
    data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const folder = await prisma.folder.findUnique({ where: { id } });
  if (!folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  if (role === "restricted" && !folder.allowedForSecondPassword) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  const productCount = await prisma.product.count({
    where: { folderId: id },
  });
  if (productCount > 0) {
    return NextResponse.json(
      { error: `Нельзя удалить папку, так как в ней содержатся товары (${productCount} шт.). Сначала переместите их или удалите.` },
      { status: 400 }
    );
  }

  await prisma.folder.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
