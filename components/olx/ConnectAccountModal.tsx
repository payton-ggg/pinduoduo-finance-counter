"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
        // Переходим на авторизацию в OLX
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
      <DialogContent className="max-w-xl glass-card border border-border/40 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Подключить аккаунт OLX</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Интегрируйте ваш магазин OLX.ua для общения с клиентами и учета продаж
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Табы выбора метода подключения */}
        <div className="flex items-center gap-2 p-1 bg-foreground/5 rounded-xl my-4">
          <button
            type="button"
            onClick={() => { setTab("oauth"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "oauth"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ⚡ Официальный OAuth
          </button>
          <button
            type="button"
            onClick={() => { setTab("manual"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "manual"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🔑 Ввод токена
          </button>
          <button
            type="button"
            onClick={() => { setTab("demo"); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              tab === "demo"
                ? "bg-emerald-600 text-white shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            ✨ Демо режим
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
            {error}
          </div>
        )}

        {/* Вкладка 1: OAuth */}
        {tab === "oauth" && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Info className="w-4 h-4 text-primary" />
                Как получить доступ в OLX Developers:
              </div>
              <ol className="list-decimal list-inside space-y-1 pl-1">
                <li>
                  Перейдите в кабинет разработчика{" "}
                  <a
                    href="https://developer.olx.ua/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline inline-flex items-center gap-0.5 font-bold"
                  >
                    developer.olx.ua <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li>Создайте приложение (Partner App) с типом доступа Web</li>
                <li>Скопируйте полученный <b>Client ID</b> и вставьте ниже</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold">Client ID приложения OLX</Label>
              <Input
                placeholder="например: 200543"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-foreground/5"
              />
            </div>

            <Button
              onClick={handleOAuthConnect}
              disabled={loading || !clientId.trim()}
              className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4" />
              )}
              Войти через OLX и авторизовать аккаунт
            </Button>
          </div>
        )}

        {/* Вкладка 2: Manual Token */}
        {tab === "manual" && (
          <form onSubmit={handleManualConnect} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Название аккаунта</Label>
              <Input
                placeholder="например: OLX Магазин Наушников"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                className="bg-foreground/5"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Access Token</Label>
              <Input
                placeholder="Bearer токен из OLX API..."
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="bg-foreground/5 font-mono text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Refresh Token (опционально)</Label>
                <Input
                  placeholder="refresh_token..."
                  value={refreshToken}
                  onChange={(e) => setRefreshToken(e.target.value)}
                  className="bg-foreground/5 font-mono text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Client Secret (для авторефреша)</Label>
                <Input
                  type="password"
                  placeholder="client_secret..."
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  className="bg-foreground/5 font-mono text-xs"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full font-bold h-11 rounded-xl shadow-lg shadow-primary/20 gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Сохранить и подключить аккаунт
            </Button>
          </form>
        )}

        {/* Вкладка 3: Demo Mode */}
        {tab === "demo" && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-bold text-base text-foreground">Мгновенный тестовый аккаунт</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1">
                Создает готовый демонстрационный магазин с реальными диалогами покупателей, привязкой к товарам и симуляцией переписки. Идеально для проверки без ожидания подтверждения от OLX!
              </p>
            </div>

            <Button
              onClick={handleCreateDemoAccount}
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20 gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              Сгенерировать демо-аккаунт и диалоги
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
