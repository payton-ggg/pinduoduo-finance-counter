import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await (params instanceof Promise ? params : Promise.resolve(params));
    const { id } = resolvedParams;
    const body = await req.json();
    const { accountName, isActive, email, phone } = body;

    const updated = await prisma.olxAccount.update({
      where: { id },
      data: {
        accountName: accountName !== undefined ? accountName.trim() : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        email: email !== undefined ? email : undefined,
        phone: phone !== undefined ? phone : undefined,
      },
    });

    return NextResponse.json({ success: true, account: updated });
  } catch (error: any) {
    console.error("PATCH /api/olx/accounts/[id] error:", error);
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

    await prisma.olxAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/olx/accounts/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
