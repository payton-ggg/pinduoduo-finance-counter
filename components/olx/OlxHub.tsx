"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, RefreshCw, Plus, Store, Sparkles } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { AccountSelector, type OlxAccountItem } from "./AccountSelector";
import { ThreadList, type ThreadItem } from "./ThreadList";
import { ChatWindow } from "./ChatWindow";
import { ProductSidebar } from "./ProductSidebar";
import { ConnectAccountModal } from "./ConnectAccountModal";
import { AccountsModal } from "./AccountsModal";
import { playNotificationSound } from "@/lib/audio";

type OlxHubProps = {
  globalRate?: number;
};

export function OlxHub({ globalRate = 5.8 }: OlxHubProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [accounts, setAccounts] = useState<OlxAccountItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAccountsModalOpen, setIsAccountsModalOpen] = useState(false);

  // Мобильное переключение панелей
  const [mobileTab, setMobileTab] = useState<"threads" | "chat" | "product">("threads");

  // Предыдущее количество непрочитанных для звукового сигнала
  const prevUnreadCountRef = useRef<number>(0);

  // 1. Загрузка аккаунтов
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/olx/accounts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAccounts(data);
      }
    } catch (e) {
      console.error("Failed to fetch accounts:", e);
    }
  }, []);

  // 2. Загрузка списка диалогов
  const fetchThreads = useCallback(async (silent = false) => {
    if (!silent) setIsSyncing(true);
    try {
      const params = new URLSearchParams();
      if (selectedAccountId && selectedAccountId !== "all") {
        params.set("accountId", selectedAccountId);
      }
      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }
      if (unreadOnly) {
        params.set("unreadOnly", "true");
      }
      if (favoritesOnly) {
        params.set("favoritesOnly", "true");
      }

      const res = await fetch(`/api/olx/threads?${params.toString()}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setThreads(data);

        // Проверяем новые непрочитанные сообщения для звука
        const currentUnread = data.reduce((sum: number, t: ThreadItem) => sum + (t.unreadCount || 0), 0);
        if (prevUnreadCountRef.current > 0 && currentUnread > prevUnreadCountRef.current) {
          playNotificationSound();
        }
        prevUnreadCountRef.current = currentUnread;

        // Если активный тред не выбран, выбираем первый
        setSelectedThreadId((prev) => {
          if (prev && data.some((t: ThreadItem) => t.id === prev)) return prev;
          return data[0]?.id || null;
        });
      }
    } catch (e) {
      console.error("Failed to fetch threads:", e);
    } finally {
      if (!silent) setIsSyncing(false);
    }
  }, [selectedAccountId, searchQuery, unreadOnly, favoritesOnly]);

  // Начальная инициализация
  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Обработка параметров OAuth callback в URL
  useEffect(() => {
    const oauthCode = searchParams.get("oauth_code");
    if (oauthCode) {
      setIsConnectModalOpen(true);
    }
  }, [searchParams]);

  // Smart Polling каждые 8 секунд
  useEffect(() => {
    const timer = setInterval(() => {
      fetchThreads(true);
      fetchAccounts();
    }, 8000);

    return () => clearInterval(timer);
  }, [fetchThreads, fetchAccounts]);

  // Отправка сообщения
  const handleSendMessage = async (text: string, attachments?: string[]) => {
    if (!selectedThreadId) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/olx/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, attachments }),
      });

      if (res.ok) {
        // Обновляем список тредов
        fetchThreads(true);
      }
    } catch (err) {
      console.error("Send error:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Переключение избранного
  const handleToggleFavorite = async (id: string, current: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/olx/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !current }),
      });
      fetchThreads(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Переключение архива
  const handleToggleArchive = async (id: string, current: boolean) => {
    try {
      await fetch(`/api/olx/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !current }),
      });
      fetchThreads(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Синхронизация всех аккаунтов с OLX
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      await fetch("/api/olx/sync", { method: "POST" });
      await fetchAccounts();
      await fetchThreads();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const selectedThread = threads.find((t) => t.id === selectedThreadId) || null;

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-h-[100vh] py-2">
      {/* Главная шапка страницы */}
      <div className="flex items-center justify-between gap-4 p-4 glass-card rounded-2xl mb-3 border border-border/40">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/")}
            className="h-10 w-10 rounded-xl border-border/40 hover:bg-primary/20 hover:text-primary transition-all group"
            title="Назад к товарам склада"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          </Button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                💬 OLX <span className="text-primary">Chat Hub</span>
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Multi-Account
              </span>
            </div>
            <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Единый центр сообщений, AI-ответов и продаж
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="glass p-1 rounded-2xl">
            <ModeToggle />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="h-10 w-10 rounded-xl border-border/40 hover:bg-primary/20"
            title="Обновить диалоги"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-primary" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Селектор аккаунтов */}
      <AccountSelector
        accounts={accounts}
        selectedAccountId={selectedAccountId}
        onSelectAccount={(id) => {
          setSelectedAccountId(id);
          setSelectedThreadId(null);
        }}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
        onOpenAccountsModal={() => setIsAccountsModalOpen(true)}
        onSyncAll={handleSyncAll}
        isSyncing={isSyncing}
      />

      {/* Мобильный переключатель табов */}
      <div className="flex md:hidden items-center gap-1 p-1 bg-card rounded-xl mb-2 border border-border/30">
        <button
          type="button"
          onClick={() => setMobileTab("threads")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "threads" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Диалоги ({threads.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Чат
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("product")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
            mobileTab === "product" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
          }`}
        >
          Склад & Сделка
        </button>
      </div>

      {/* Основной 3-панельный лейаут */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Левая панель: Список диалогов */}
        <div
          className={`h-full min-h-0 md:col-span-4 lg:col-span-3 ${
            mobileTab === "threads" ? "block" : "hidden md:block"
          }`}
        >
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelectThread={(id) => {
              setSelectedThreadId(id);
              setMobileTab("chat");
            }}
            onToggleFavorite={handleToggleFavorite}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            unreadOnly={unreadOnly}
            onToggleUnreadOnly={() => setUnreadOnly(!unreadOnly)}
            favoritesOnly={favoritesOnly}
            onToggleFavoritesOnly={() => setFavoritesOnly(!favoritesOnly)}
            showAccountBadge={selectedAccountId === "all"}
          />
        </div>

        {/* Центральная панель: Окно переписки */}
        <div
          className={`h-full min-h-0 md:col-span-8 lg:col-span-6 ${
            mobileTab === "chat" ? "block" : "hidden md:block"
          }`}
        >
          <ChatWindow
            thread={selectedThread}
            onSendMessage={handleSendMessage}
            onToggleFavorite={(id, cur) => handleToggleFavorite(id, cur)}
            onToggleArchive={handleToggleArchive}
            onOpenProductSidebar={() => setMobileTab("product")}
            isSending={isSending}
          />
        </div>

        {/* Правая панель: Склад, прибыль и быстрая продажа */}
        <div
          className={`h-full min-h-0 md:hidden lg:block lg:col-span-3 ${
            mobileTab === "product" ? "block" : "hidden lg:block"
          }`}
        >
          <ProductSidebar
            thread={selectedThread}
            onThreadUpdated={() => {
              fetchThreads(true);
            }}
            globalRate={globalRate}
          />
        </div>
      </div>

      {/* Модалки подключения и управления аккаунтами */}
      <ConnectAccountModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onAccountConnected={() => {
          fetchAccounts();
          fetchThreads();
        }}
      />

      <AccountsModal
        isOpen={isAccountsModalOpen}
        onClose={() => setIsAccountsModalOpen(false)}
        accounts={accounts}
        onRefresh={() => {
          fetchAccounts();
          fetchThreads();
        }}
        onOpenConnectModal={() => setIsConnectModalOpen(true)}
      />
    </div>
  );
}
