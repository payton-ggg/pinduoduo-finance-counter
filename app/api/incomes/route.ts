import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");
  const incomes = await prisma.income.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(incomes);
}

export async function POST(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const created = await prisma.income.create({
    data: {
      productId: data.productId,
      amount: data.amount,
    },
  });
  return NextResponse.json(created);
}

export async function PATCH(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const updated = await prisma.income.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  await prisma.income.delete({ where: { id } });
  return NextResponse.json({ message: "Income deleted" });
}
