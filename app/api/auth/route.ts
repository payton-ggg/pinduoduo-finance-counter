import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correctPassword = process.env.SITE_PASSWORD;

  if (!correctPassword) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  if (password === correctPassword) {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "Неверный пароль" }, { status: 401 });
}
