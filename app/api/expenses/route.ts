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
  const expenses = await prisma.expense.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(expenses);
}

export async function POST(req: Request) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const created = await prisma.expense.create({
    data: {
      productId: data.productId,
      amount: data.amount,
      type: data.type,
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
  const updated = await prisma.expense.update({
    where: { id: data.id },
    data: {
      amount: data.amount,
      type: data.type,
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
  await prisma.expense.delete({ where: { id } });
  return NextResponse.json({ message: "Expense deleted" });
}
