"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  MessageSquare,
  Package,
  Clock,
  CheckCheck,
  Check,
  Tag,
} from "lucide-react";

export type ThreadItem = {
  id: string;
  olxThreadId: string;
  accountId: string;
  account: {
    id: string;
    accountName: string;
    avatarUrl?: string | null;
  };
  advertTitle?: string | null;
  advertPrice?: number | null;
  advertImage?: string | null;
  interlocutorName?: string | null;
  unreadCount: number;
  lastMessageText?: string | null;
  lastMessageAt?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  buyerNotes?: string | null;
  linkedProduct?: {
    id: string;
    name: string;
    images?: string[];
  } | null;
  linkedVariant?: {
    id: string;
    priceInUA?: number | null;
  } | null;
};

type ThreadListProps = {
  threads: ThreadItem[];
  selectedThreadId: string | null;
  onSelectThread: (id: string) => void;
  onToggleFavorite: (id: string, current: boolean, e: React.MouseEvent) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  unreadOnly: boolean;
  onToggleUnreadOnly: () => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  showAccountBadge?: boolean;
};

function formatRelativeTime(dateStr?: string | null) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes}м`;
  if (diffHours < 24) return `${diffHours}ч`;
  if (diffDays === 1) return "вчера";
  if (diffDays < 7) return `${diffDays}д`;
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelectThread,
  onToggleFavorite,
  searchQuery,
  onSearchChange,
  unreadOnly,
  onToggleUnreadOnly,
  favoritesOnly,
  onToggleFavoritesOnly,
  showAccountBadge = true,
}: ThreadListProps) {
  return (
    <div className="flex flex-col h-full bg-card/60 rounded-2xl border border-border/40 overflow-hidden shadow-lg backdrop-blur-md">
      {/* Шапка списка с поиском и фильтрами */}
      <div className="p-3 border-b border-border/30 space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Поиск по покупателю, товару или тексту..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 pr-3 bg-foreground/5 border-none text-xs h-9 rounded-xl focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              if (unreadOnly) onToggleUnreadOnly();
              if (favoritesOnly) onToggleFavoritesOnly();
            }}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              !unreadOnly && !favoritesOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-foreground/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            Все ({threads.length})
          </button>
          <button
            type="button"
            onClick={onToggleUnreadOnly}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              unreadOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-foreground/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            Непрочитанные
          </button>
          <button
            type="button"
            onClick={onToggleFavoritesOnly}
            className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-all ${
              favoritesOnly
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-foreground/5 text-muted-foreground hover:text-foreground"
            }`}
          >
            ⭐ Избранные
          </button>
        </div>
      </div>

      {/* Список диалогов */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/20 p-1.5 space-y-1">
        {threads.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground space-y-2">
            <MessageSquare className="w-10 h-10 mx-auto opacity-20" />
            <p className="text-xs font-semibold">Диалогов не найдено</p>
            <p className="text-[11px] opacity-70">
              {searchQuery ? "Попробуйте изменить поисковый запрос" : "Новые сообщения от покупателей появятся здесь"}
            </p>
          </div>
        ) : (
          threads.map((thread) => {
            const isSelected = selectedThreadId === thread.id;
            const hasUnread = thread.unreadCount > 0;

            return (
              <div
                key={thread.id}
                onClick={() => onSelectThread(thread.id)}
                className={`p-3 rounded-xl transition-all cursor-pointer relative group ${
                  isSelected
                    ? "bg-primary/15 border border-primary/40 shadow-sm"
                    : hasUnread
                    ? "bg-foreground/5 hover:bg-foreground/10 font-medium"
                    : "hover:bg-foreground/5 opacity-90 hover:opacity-100"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Аватар покупателя */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        hasUnread
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "bg-foreground/10 text-foreground"
                      }`}
                    >
                      {(thread.interlocutorName || "П").slice(0, 1).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs truncate ${hasUnread ? "font-black text-foreground" : "font-semibold text-foreground/90"}`}>
                          {thread.interlocutorName || "Покупатель OLX"}
                        </span>
                        {thread.isFavorite && (
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                        )}
                      </div>
                      {showAccountBadge && thread.account && (
                        <div className="text-[10px] text-muted-foreground truncate opacity-75">
                          {thread.account.accountName}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {formatRelativeTime(thread.lastMessageAt)}
                    </span>
                    {hasUnread && (
                      <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                        {thread.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {/* Заголовок объявления или связанного товара */}
                <div className="flex items-center gap-1.5 my-1 text-[11px] text-primary/90 font-medium truncate bg-primary/5 px-2 py-0.5 rounded-md">
                  <Tag className="w-3 h-3 shrink-0 text-primary" />
                  <span className="truncate">
                    {thread.advertTitle || thread.linkedProduct?.name || "Товар без названия"}
                  </span>
                  {thread.advertPrice && (
                    <span className="font-bold text-foreground shrink-0 ml-auto text-[10px]">
                      {thread.advertPrice} ₴
                    </span>
                  )}
                </div>

                {/* Превью последнего сообщения */}
                <p className={`text-xs line-clamp-1 mt-0.5 ${hasUnread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                  {thread.lastMessageText || "Переписка начата"}
                </p>

                {/* Быстрая кнопка в избранное при наведении */}
                <button
                  type="button"
                  onClick={(e) => onToggleFavorite(thread.id, thread.isFavorite, e)}
                  className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-background/80"
                  title={thread.isFavorite ? "Убрать из избранного" : "В избранное"}
                >
                  <Star
                    className={`w-3.5 h-3.5 ${
                      thread.isFavorite ? "text-amber-400 fill-amber-400" : "text-muted-foreground hover:text-amber-400"
                    }`}
                  />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
