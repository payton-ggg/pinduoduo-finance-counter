"use client";

import { useState } from "react";
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
  ArrowRight,
  HelpCircle,
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
  const [tab, setTab] = useState<"oauth" | "manual" | "demo">("oauth");
  const [accountName, setAccountName] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthConnect = async () => {
    if (!clientId.trim()) {
      setError("Пожалуйста, укажите Client ID вашего приложения OLX");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(
        `/api/olx/oauth?action=authorize&clientId=${encodeURIComponent(clientId.trim())}`
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
                Синхронизация диалогов, быстрые ответы и автоматический учет заказов
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Переключатель вкладок (Сегментированный контрол) */}
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
            <span>OAuth 2.0</span>
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
            <span>Токен API</span>
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
          <div className="p-3.5 mb-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <Info className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Вкладка 1: Официальный OAuth 2.0 */}
        {tab === "oauth" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold text-xs">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                Инструкция по подключению через OLX Developers:
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    Откройте портал разработчиков{" "}
                    <a
                      href="https://developer.olx.ua/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline inline-flex items-center gap-0.5 font-bold"
                    >
                      developer.olx.ua <ExternalLink className="w-3 h-3" />
                    </a>
                  </span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0 mt-0.5">
                    2
                  </span>
                  <span>Создайте приложение (Partner App) и укажите тип Web</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0 mt-0.5">
                    3
                  </span>
                  <span>Скопируйте полученный <b>Client ID</b> и вставьте в поле ниже</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground">
                  Client ID приложения OLX
                </Label>
                <span className="text-[10px] text-muted-foreground">Обязательное поле</span>
              </div>
              <Input
                placeholder="например: 200543"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-muted/40 border-border/60 h-11 text-sm font-medium rounded-xl focus:bg-background transition-colors"
              />
            </div>

            <Button
              onClick={handleOAuthConnect}
              disabled={loading || !clientId.trim()}
              className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Войти через OLX и авторизовать магазин
            </Button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground/80 font-medium">
              <Lock className="w-3 h-3" />
              <span>Безопасная авторизация через официальный OAuth 2.0 протокол OLX</span>
            </div>
          </div>
        )}

        {/* Вкладка 2: Ручной ввод токена */}
        {tab === "manual" && (
          <form onSubmit={handleManualConnect} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">
                Название магазина / профиля
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
              <Label className="text-xs font-bold text-foreground">
                Access Token (Bearer)
              </Label>
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
                  <span>Без ключей и API токенов</span>
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

