"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Trash2,
  RefreshCw,
  Plus,
  Loader2,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";

type Account = {
  id: string;
  accountName: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  lastSyncAt?: string | null;
  tokenExpiresAt?: string | null;
  threadCount: number;
  unreadCount: number;
};

type AccountsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  onRefresh: () => void;
  onOpenConnectModal: () => void;
};

export function AccountsModal({
  isOpen,
  onClose,
  accounts,
  onRefresh,
  onOpenConnectModal,
}: AccountsModalProps) {
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSyncAccount = async (id: string) => {
    setSyncingId(id);
    try {
      await fetch("/api/olx/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id }),
      });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Вы уверены, что хотите отключить этот аккаунт OLX? Все локальные чаты этого аккаунта будут удалены.")) {
      return;
    }
    setDeletingId(id);
    try {
      await fetch(`/api/olx/accounts/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-card border border-border/40 shadow-2xl p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Подключенные аккаунты OLX</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Управление магазинами, токенами и принудительная синхронизация
                </DialogDescription>
              </div>
            </div>

            <Button
              onClick={() => { onClose(); onOpenConnectModal(); }}
              size="sm"
              className="font-bold rounded-xl gap-1.5 shadow-md shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> Добавить
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-3 my-4 max-h-[60vh] overflow-y-auto pr-1">
          {accounts.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-2xl border-border/50 text-muted-foreground">
              <Store className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p className="font-semibold text-sm">Нет подключенных аккаунтов</p>
              <p className="text-xs text-muted-foreground mt-1">
                Подключите ваш первый магазин OLX для работы с переписками
              </p>
              <Button
                onClick={() => { onClose(); onOpenConnectModal(); }}
                className="mt-4 font-bold rounded-xl"
                size="sm"
              >
                Подключить аккаунт
              </Button>
            </div>
          ) : (
            accounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-foreground/5 border border-border/30 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-lg text-primary shrink-0 overflow-hidden">
                    {acc.avatarUrl ? (
                      <img src={acc.avatarUrl} alt={acc.accountName} className="w-full h-full object-cover" />
                    ) : (
                      acc.accountName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground truncate">{acc.accountName}</h4>
                      {acc.isActive ? (
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] px-1.5 py-0">
                          Активен
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] px-1.5 py-0">
                          Отключен
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>Диалогов: <b className="text-foreground">{acc.threadCount}</b></span>
                      {acc.unreadCount > 0 && (
                        <span className="text-primary font-bold">
                          Непрочитанных: {acc.unreadCount}
                        </span>
                      )}
                      {acc.lastSyncAt && (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Clock className="w-3 h-3" />
                          Синхр.: {new Date(acc.lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleSyncAccount(acc.id)}
                    disabled={syncingId === acc.id}
                    title="Синхронизировать сейчас"
                    className="h-9 w-9 rounded-xl border-border/40 hover:bg-primary/20 hover:text-primary"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncingId === acc.id ? "animate-spin text-primary" : ""}`} />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDeleteAccount(acc.id)}
                    disabled={deletingId === acc.id}
                    title="Отключить аккаунт"
                    className="h-9 w-9 rounded-xl border-border/40 hover:bg-destructive/20 hover:text-destructive"
                  >
                    {deletingId === acc.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
