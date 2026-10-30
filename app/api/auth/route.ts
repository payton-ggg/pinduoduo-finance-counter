import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  const correctPassword = process.env.SITE_PASSWORD;
  const correctPassword2 = process.env.SITE_PASSWORD2;

  if (!correctPassword) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let role: "admin" | "restricted" | null = null;
  if (password === correctPassword) {
    role = "admin";
  } else if (correctPassword2 && password === correctPassword2) {
    role = "restricted";
  }

  if (role) {
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set("site_password", password, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
    return response;
  }

  return NextResponse.json({ ok: false, error: "Неверный пароль" }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set("site_password", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}
