"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Store,
  KeyRound,
  ExternalLink,
  Sparkles,
  Loader2,
  CheckCircle2,
  Info,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Copy,
  Check,
  AlertTriangle,
  Server,
} from "lucide-react";

type ConnectAccountModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAccountConnected: () => void;
};

export function ConnectAccountModal({
  isOpen,
  onClose,
  onAccountConnected,
}: ConnectAccountModalProps) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"oauth" | "manual" | "demo">("oauth");
  const [accountName, setAccountName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedUri, setCopiedUri] = useState(false);

  // Вычисляем Redirect URI для кабинета OLX
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/olx/oauth?action=callback`
      : "";

  // Загрузка сохраненных ключей из sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedClientId = sessionStorage.getItem("olx_client_id");
      const savedClientSecret = sessionStorage.getItem("olx_client_secret");
      const savedAccountName = sessionStorage.getItem("olx_account_name");

      if (savedClientId) setClientId(savedClientId);
      if (savedClientSecret) setClientSecret(savedClientSecret);
      if (savedAccountName) setAccountName(savedAccountName);
    }
  }, []);

  // Автоматическая обработка OAuth callback (?oauth_code=...)
  useEffect(() => {
    const oauthCode = searchParams.get("oauth_code");
    const oauthError = searchParams.get("oauth_error");

    if (oauthError) {
      setError(`Ошибка авторизации от OLX: ${oauthError}`);
    } else if (oauthCode && isOpen) {
      const savedClientId = sessionStorage.getItem("olx_client_id") || clientId;
      const savedClientSecret = sessionStorage.getItem("olx_client_secret") || clientSecret;
      const savedAccountName = sessionStorage.getItem("olx_account_name") || accountName;

      if (savedClientId && savedClientSecret) {
        handleExchangeOAuthCode(oauthCode, savedClientId, savedClientSecret, savedAccountName);
      } else {
        setError("Код авторизации получен, но отсутствуют Client ID и Client Secret. Введите их ниже.");
      }
    }
  }, [searchParams, isOpen]);

  const handleExchangeOAuthCode = async (
    code: string,
    cId: string,
    cSecret: string,
    accName: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/olx/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "exchange",
          code,
          clientId: cId.trim(),
          clientSecret: cSecret.trim(),
          accountName: accName.trim() || undefined,
          redirectUri,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось обменять код авторизации на токен");
      }

      // Очищаем временные данные
      sessionStorage.removeItem("olx_client_id");
      sessionStorage.removeItem("olx_client_secret");
      sessionStorage.removeItem("olx_account_name");

      onAccountConnected();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyRedirectUri = () => {
    if (!redirectUri) return;
    navigator.clipboard.writeText(redirectUri);
    setCopiedUri(true);
    setTimeout(() => setCopiedUri(false), 2000);
  };

  // 1. Старт OAuth через браузер
  const handleOAuthConnect = async () => {
    if (!clientId.trim()) {
      setError("Пожалуйста, укажите Client ID");
      return;
    }
    if (!clientSecret.trim()) {
      setError("Пожалуйста, укажите Client Secret от вашего приложения OLX");
      return;
    }

    // Сохраняем в sessionStorage перед переходом
    sessionStorage.setItem("olx_client_id", clientId.trim());
    sessionStorage.setItem("olx_client_secret", clientSecret.trim());
    sessionStorage.setItem("olx_account_name", accountName.trim());

    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/olx/oauth?action=authorize&clientId=${encodeURIComponent(
          clientId.trim()
        )}&redirectUri=${encodeURIComponent(redirectUri)}`
      );
      const data = await res.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error(data.error || "Не удалось сгенерировать ссылку авторизации");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // 2. Прямой вход через Client Credentials (без браузерного редиректа на OLX, обходит CloudFront WAF)
  const handleDirectCredentialsConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError("Заполните Client ID и Client Secret");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/olx/oauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "credentials",
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          accountName: accountName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data.error ||
            "Не удалось подключиться через Client Credentials. Проверьте правильность Client ID и Secret."
        );
      }

      onAccountConnected();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Ручной ввод токена
  const handleManualConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountName.trim() || !accessToken.trim()) {
      setError("Заполните название аккаунта и Access Token");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/olx/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: accountName.trim(),
          clientId: clientId.trim() || null,
          clientSecret: clientSecret.trim() || null,
          accessToken: accessToken.trim(),
          refreshToken: refreshToken.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Ошибка при подключении аккаунта");
      }

      onAccountConnected();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Демо аккаунт
  const handleCreateDemoAccount = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/olx/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: "OLX Магазин Электроники (Демо)",
          isDemo: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось создать демо-аккаунт");
      }

      onAccountConnected();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card text-card-foreground border border-border/60 shadow-2xl p-5 sm:p-7 rounded-3xl backdrop-blur-xl">
        {/* Шапка модального окна */}
        <DialogHeader className="mb-2">
          <div className="flex items-center gap-3.5">
            <div className="relative p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20 shadow-sm shrink-0">
              <Store className="w-6 h-6" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-card" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  Подключение магазина OLX
                </DialogTitle>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  OLX.ua API
                </span>
              </div>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 font-medium">
                Синхронизация диалогов, быстрые ответы и учет продаж
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Переключатель вкладок */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-muted/50 rounded-2xl my-3.5 border border-border/50">
          <button
            type="button"
            onClick={() => {
              setTab("oauth");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === "oauth"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${tab === "oauth" ? "text-primary" : ""}`} />
            <span>OAuth & Ключи</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("manual");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === "manual"
                ? "bg-background text-foreground shadow-sm border border-border/40"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <KeyRound className={`w-3.5 h-3.5 ${tab === "manual" ? "text-primary" : ""}`} />
            <span>Ввод Токена</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("demo");
              setError(null);
            }}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              tab === "demo"
                ? "bg-primary text-primary-foreground shadow-sm font-black"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Демо-режим</span>
          </button>
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="p-3.5 mb-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-start gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Вкладка 1: OAuth & Ключи */}
        {tab === "oauth" && (
          <div className="space-y-3.5">
            {/* Инструкция и Redirect URI */}
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/50 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-foreground font-bold">
                  <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                  Портал OLX Developers:
                </span>
                <a
                  href="https://developer.olx.ua/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold text-[11px]"
                >
                  developer.olx.ua <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Redirect URI поле */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Redirect URI (укажите в настройках Partner App):</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={redirectUri}
                    className="bg-background/80 border-border/60 h-8 font-mono text-[11px] text-muted-foreground select-all"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyRedirectUri}
                    className="h-8 px-2.5 rounded-xl text-xs gap-1 shrink-0 font-bold"
                  >
                    {copiedUri ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span className="text-emerald-500">Скопировано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Копия</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Поля Client ID & Client Secret */}
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  Client ID <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="например: 200543"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="bg-muted/40 border-border/60 h-10 text-sm font-medium rounded-xl focus:bg-background transition-colors"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-foreground">
                  Client Secret <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="password"
                  placeholder="секретный ключ приложения из OLX..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="bg-muted/40 border-border/60 h-10 font-mono text-xs rounded-xl focus:bg-background transition-colors"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-muted-foreground">
                  Название магазина (опционально)
                </Label>
                <Input
                  placeholder="например: Главный магазин OLX"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="bg-muted/40 border-border/60 h-9 text-xs rounded-xl focus:bg-background transition-colors"
                />
              </div>
            </div>

            {/* Блок с двумя вариантами подключения */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <Button
                onClick={handleOAuthConnect}
                disabled={loading || !clientId.trim() || !clientSecret.trim()}
                className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 gap-2 cursor-pointer text-xs"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                Войти через браузер (OAuth)
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleDirectCredentialsConnect}
                disabled={loading || !clientId.trim() || !clientSecret.trim()}
                className="w-full font-bold h-11 rounded-xl border-border/60 hover:bg-primary/10 hover:text-primary gap-2 cursor-pointer text-xs"
                title="Подключение напрямую с сервера без редиректа в браузере (обходит CloudFront WAF)"
              >
                <Server className="w-4 h-4" />
                Прямой вход (Server API)
              </Button>
            </div>

            {/* Подсказка про ошибку 403 CloudFront */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 text-amber-500 font-bold">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Если OLX выдает ошибку «403 ERROR / CloudFront»:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-0.5 text-foreground/80 leading-relaxed">
                <li>
                  Убедитесь, что скопировали <b>Redirect URI</b> в настройки приложения на <b>developer.olx.ua</b>.
                </li>
                <li>
                  Если браузер блокируется по IP/VPN, нажмите кнопку <b>«Прямой вход (Server API)»</b> или вставьте токен во вкладке <b>«Ввод Токена»</b>.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Вкладка 2: Ручной ввод токена */}
        {tab === "manual" && (
          <form onSubmit={handleManualConnect} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Название магазина / профиля <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="например: OLX Магазин Наушников"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-muted/40 border-border/60 h-10 text-sm rounded-xl focus:bg-background transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Access Token (Bearer) <span className="text-destructive">*</span>
                </Label>
                <span className="text-[10px] text-muted-foreground">Сгенерированный в OLX</span>
              </div>
              <Input
                placeholder="Bearer токен из OLX API..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="bg-muted/40 border-border/60 h-10 font-mono text-xs rounded-xl focus:bg-background transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Refresh Token <span className="font-normal opacity-70">(опц.)</span>
                </Label>
                <Input
                  placeholder="refresh_token..."
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  className="bg-muted/40 border-border/60 h-10 font-mono text-xs rounded-xl focus:bg-background transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">
                  Client Secret <span className="font-normal opacity-70">(опц.)</span>
                </Label>
                <Input
                  type="password"
                  placeholder="client_secret..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="bg-muted/40 border-border/60 h-10 font-mono text-xs rounded-xl focus:bg-background transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Сохранить и подключить магазин
            </Button>
          </form>
        )}

        {/* Вкладка 3: Демо режим */}
        {tab === "demo" && (
          <div className="space-y-4 py-2">
            <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-inner">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>

              <div>
                <h4 className="font-black text-base text-foreground">
                  Мгновенный тестовый аккаунт
                </h4>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 leading-relaxed">
                  Создает готовый демонстрационный магазин с реальными диалогами покупателей, привязкой к товарам и симуляцией переписки.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-2 border-t border-border/40">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>3 активных диалога</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Привязка к товарам склада</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Быстрые ответы и AI</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-foreground/80">
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>Без ожидания ключей от OLX</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handleCreateDemoAccount}
              disabled={loading}
              className="w-full font-black h-11 rounded-xl shadow-lg shadow-primary/20 gap-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Сгенерировать демо-магазин
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


