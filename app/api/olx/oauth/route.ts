import { NextResponse } from "next/server";
import { OlxApiClient } from "@/lib/olx/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const clientId = searchParams.get("clientId");
  const clientSecret = searchParams.get("clientSecret");
  const redirectUri = searchParams.get("redirectUri") || `${new URL(req.url).origin}/api/olx/oauth?action=callback`;

  // 1. Генерация ссылки на авторизацию
  if (action === "authorize") {
    if (!clientId) {
      return NextResponse.json({ error: "clientId is required" }, { status: 400 });
    }
    const authUrl = OlxApiClient.getAuthorizationUrl({
      clientId,
      redirectUri,
      state: state || undefined,
    });
    return NextResponse.json({ authUrl });
  }

  // 2. Обработка Callback от OLX
  if (action === "callback" && code) {
    try {
      // Пытаемся найти сохраненные параметры или использовать переданные
      // Редиректим пользователя обратно в /olx с кодом
      return NextResponse.redirect(
        `${new URL(req.url).origin}/olx?oauth_code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || "")}`
      );
    } catch (e: any) {
      return NextResponse.redirect(
        `${new URL(req.url).origin}/olx?oauth_error=${encodeURIComponent(e.message)}`
      );
    }
  }

  // 3. Обмен кода на токены через POST/GET
  if (code && clientId && clientSecret) {
    try {
      const tokens = await OlxApiClient.exchangeCodeForTokens({
        clientId,
        clientSecret,
        code,
        redirectUri,
      });

      let olxUser = null;
      try {
        olxUser = await OlxApiClient.getMe(tokens.access_token);
      } catch (e) {
        console.warn("Could not fetch OLX user info:", e);
      }

      const account = await prisma.olxAccount.create({
        data: {
          accountName: (olxUser?.name || olxUser?.email || "Аккаунт OLX") + ` (${new Date().toLocaleDateString()})`,
          email: olxUser?.email || null,
          phone: olxUser?.phone || null,
          olxUserId: olxUser?.id ? String(olxUser.id) : null,
          avatarUrl: olxUser?.avatar || null,
          clientId,
          clientSecret,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || null,
          tokenExpiresAt: new Date(Date.now() + tokens.expires_in * 1000),
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, account });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
}
