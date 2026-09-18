"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Layers,
} from "lucide-react";

export type OlxAccountItem = {
  id: string;
  accountName: string;
  email?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  unreadCount: number;
  threadCount: number;
};

type AccountSelectorProps = {
  accounts: OlxAccountItem[];
  selectedAccountId: string; // "all" or specific account ID
  onSelectAccount: (id: string) => void;
  onOpenConnectModal: () => void;
  onOpenAccountsModal: () => void;
  onSyncAll: () => void;
  isSyncing: boolean;
};

export function AccountSelector({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onOpenConnectModal,
  onOpenAccountsModal,
  onSyncAll,
  isSyncing,
}: AccountSelectorProps) {
  const totalUnreadAll = accounts.reduce((acc, a) => acc + (a.unreadCount || 0), 0);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 glass-card rounded-2xl mb-4 border border-border/40">
      {/* Список аккаунтов без внутреннего скролла — аккуратный flex-wrap */}
      <div className="flex flex-wrap items-center gap-2 py-0.5 flex-1 min-w-0">
        {/* Кнопка: Все аккаунты */}
        <button
          type="button"
          onClick={() => onSelectAccount("all")}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            selectedAccountId === "all"
              ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
              : "bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Все аккаунты</span>
          {totalUnreadAll > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                selectedAccountId === "all"
                  ? "bg-background text-primary"
                  : "bg-primary text-primary-foreground animate-pulse"
              }`}
            >
              {totalUnreadAll}
            </span>
          )}
        </button>

        {/* Чипы каждого аккаунта */}
        {accounts.map((account) => {
          const isSelected = selectedAccountId === account.id;
          return (
            <button
              key={account.id}
              type="button"
              onClick={() => onSelectAccount(account.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]"
                  : "bg-foreground/5 hover:bg-foreground/10 text-muted-foreground hover:text-foreground border-border/20"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] overflow-hidden ${
                  isSelected ? "bg-background/20 text-white" : "bg-primary/10 text-primary"
                }`}
              >
                {account.avatarUrl ? (
                  <img src={account.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Store className="w-3 h-3" />
                )}
              </div>
              <span>{account.accountName}</span>
              {account.unreadCount > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isSelected
                      ? "bg-background text-primary"
                      : "bg-primary text-primary-foreground animate-pulse"
                  }`}
                >
                  {account.unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <Button
          variant="outline"
          size="sm"
          onClick={onSyncAll}
          disabled={isSyncing}
          className="h-9 px-3 rounded-xl border-border/40 hover:bg-primary/20 hover:text-primary gap-1.5 text-xs font-bold cursor-pointer"
          title="Синхронизировать все аккаунты с OLX"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-primary" : ""}`} />
          <span className="hidden sm:inline">Синхронизация</span>
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onOpenAccountsModal}
          className="h-9 w-9 rounded-xl border-border/40 hover:bg-foreground/10 cursor-pointer"
          title="Настройки аккаунтов"
        >
          <Settings className="w-4 h-4 text-muted-foreground" />
        </Button>

        <Button
          size="sm"
          onClick={onOpenConnectModal}
          className="h-9 px-3 rounded-xl font-bold gap-1.5 shadow-md shadow-primary/20 text-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Подключить</span>
        </Button>
      </div>
    </div>
  );
}
