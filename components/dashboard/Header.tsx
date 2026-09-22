"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Calculator,
  Search,
  X,
  Coins,
  MessageSquareText,
  Eye,
  EyeOff,
  Menu,
  CheckSquare,
  RotateCcw,
} from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useRouter } from "next/navigation";

type HeaderProps = {
  onAdd?: () => void;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  onOpenPriceModal?: () => void;
  hasSelection?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  hideLockedFolders?: boolean;
  onToggleHideLockedFolders?: () => void;
  isAdmin?: boolean;
};

export function Header({
  onAdd,
  onClearSelection,
  onSelectAll,
  onOpenPriceModal,
  hasSelection,
  searchQuery = "",
  onSearchQueryChange,
  hideLockedFolders = false,
  onToggleHideLockedFolders,
  isAdmin = true,
}: HeaderProps) {
  const router = useRouter();
  const [unreadOlxCount, setUnreadOlxCount] = useState<number>(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const checkOlxUnread = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/olx/accounts");
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && Array.isArray(data)) {
          const total = data.reduce((acc, a) => acc + (a.unreadCount || 0), 0);
          setUnreadOlxCount(total);
        }
      } catch (e) {
        // silent
      }
    };

    checkOlxUnread();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkOlxUnread();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", checkOlxUnread);

    const interval = setInterval(checkOlxUnread, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", checkOlxUnread);
    };
  }, []);

  return (
    <div className="glass-card p-4 sm:p-6 mb-6 sm:mb-8 rounded-3xl border border-border/50 shadow-xl backdrop-blur-xl">
      {/* ================= DESKTOP HEADER (MD & ABOVE) ================= */}
      <div className="hidden md:flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Логотип и заголовок */}
        <div className="space-y-0.5 text-left shrink-0">
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-foreground flex items-center gap-2 whitespace-nowrap">
            📦 China <span className="text-primary">Manager</span>
          </h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            Control Panel v2.0
          </p>
        </div>

        {/* Поиск и быстрый выбор */}
        <div className="flex-1 flex items-center gap-2 max-w-md w-full relative">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Умный поиск товаров..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              className="w-full bg-foreground/5 border border-border/40 rounded-2xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange?.("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Десктопная панель действий */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {/* Переключатель скрытия закрытых папок (Stealth Mode) */}
          {onToggleHideLockedFolders && (
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleHideLockedFolders}
              className={`rounded-2xl border border-border/50 h-10 px-3 gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                hideLockedFolders
                  ? "bg-amber-500/15 text-amber-500 border-amber-500/30 hover:bg-amber-500/25"
                  : "glass hover:bg-primary/15 text-muted-foreground hover:text-foreground"
              }`}
              title={
                hideLockedFolders
                  ? "Закрытые папки скрыты. Нажмите, чтобы показать."
                  : "Скрыть закрытые папки из общего просмотра"
              }
            >
              {hideLockedFolders ? (
                <>
                  <EyeOff className="w-4 h-4 text-amber-500" />
                  <span className="hidden xl:inline">Скрыты</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  <span className="hidden xl:inline">Папки</span>
                </>
              )}
            </Button>
          )}

          {/* Кнопка перехода в OLX Сообщения */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/olx")}
            className="glass rounded-2xl border border-border/50 hover:bg-primary/20 transition-all h-10 px-3.5 shrink-0 flex items-center gap-2 group font-bold text-xs cursor-pointer"
            title="OLX Мульти-аккаунт чат и заказы"
          >
            <MessageSquareText className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="hidden lg:inline">OLX Чат</span>
            {unreadOlxCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.2 rounded-full shadow-md animate-pulse">
                {unreadOlxCount}
              </span>
            )}
          </Button>

          {/* Управление ценами */}
          {onOpenPriceModal && (
            <Button
              variant="outline"
              size="icon"
              onClick={onOpenPriceModal}
              className="glass rounded-2xl border border-border/50 hover:bg-primary/20 transition-all h-10 w-10 shrink-0 flex items-center justify-center group cursor-pointer"
              title="Управление ценами товаров (Закупка / Продажа)"
            >
              <Coins className="w-4 h-4 group-hover:scale-110 text-primary transition-transform duration-300" />
            </Button>
          )}

          {/* Калькулятор */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push(`/calculator?from=${encodeURIComponent(window.location.pathname)}`)}
            className="glass rounded-2xl border border-border/50 hover:bg-primary/20 transition-all h-10 w-10 shrink-0 flex items-center justify-center group cursor-pointer"
            title="Калькулятор валют"
          >
            <Calculator className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
          </Button>

          {/* Переключатель темы */}
          <div className="glass p-1 rounded-2xl border border-border/50">
            <ModeToggle />
          </div>

          {/* Обновить страницу */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
            className="glass rounded-2xl border border-border/50 hover:bg-primary/20 transition-all h-10 w-10 shrink-0 flex items-center justify-center group cursor-pointer"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          </Button>

          {/* Добавить товар */}
          <Button
            className="flex items-center justify-center gap-1.5 rounded-2xl font-black px-4 h-10 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-xs cursor-pointer"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4" /> Добавить
          </Button>
        </div>
      </div>

      {/* ================= MOBILE HEADER (SCREEN < MD) ================= */}
      <div className="md:hidden flex flex-col gap-3">
        {/* Верхняя строка: Логотип + Быстрые действия + Бургер */}
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <h1 className="text-xl font-black tracking-tight text-foreground flex items-center gap-1.5">
              📦 China <span className="text-primary">Manager</span>
            </h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              Control Panel
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Кнопка перехода в OLX Чат */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.push("/olx")}
              className="glass rounded-xl border border-border/50 h-9 w-9 relative cursor-pointer"
              title="OLX Чат"
            >
              <MessageSquareText className="w-4 h-4 text-primary" />
              {unreadOlxCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full shadow-md animate-pulse">
                  {unreadOlxCount}
                </span>
              )}
            </Button>

            {/* Быстрое добавление товара */}
            <Button
              size="sm"
              onClick={onAdd}
              className="h-9 px-3 rounded-xl font-bold text-xs gap-1 shadow-md shadow-primary/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Товар
            </Button>

            {/* Бургер-кнопка меню */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`rounded-xl border h-9 w-9 transition-all cursor-pointer ${
                isMobileMenuOpen
                  ? "bg-primary text-primary-foreground border-primary"
                  : "glass border-border/50 text-foreground"
              }`}
              title="Меню действий"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Нижняя строка: Полноширинный умный поиск */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Поиск по названию или папке..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange?.(e.target.value)}
            className="w-full bg-foreground/5 border border-border/40 rounded-xl pl-9 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchQueryChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ================= ВЫПАДАЮЩАЯ МОБИЛЬНАЯ ШТОРКА (BURGER MENU) ================= */}
        {isMobileMenuOpen && (
          <div className="mt-2 p-3.5 rounded-2xl bg-muted/40 border border-border/60 backdrop-blur-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
            {/* 1. Режим скрытности закрытых папок */}
            {onToggleHideLockedFolders && (
              <button
                type="button"
                onClick={() => {
                  onToggleHideLockedFolders();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40 hover:bg-foreground/5 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-1.5 rounded-lg ${
                      hideLockedFolders
                        ? "bg-amber-500/15 text-amber-500"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {hideLockedFolders ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Скрытые папки</div>
                    <div className="text-[10px] text-muted-foreground">
                      {hideLockedFolders
                        ? "Закрытые папки спрятаны"
                        : "Показаны все папки и замки"}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                    hideLockedFolders
                      ? "bg-amber-500/15 text-amber-500 border-amber-500/30"
                      : "bg-muted text-muted-foreground border-border/40"
                  }`}
                >
                  {hideLockedFolders ? "Скрыты" : "Видны"}
                </span>
              </button>
            )}

            {/* 2. Управление ценами */}
            {onOpenPriceModal && (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenPriceModal();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40 hover:bg-foreground/5 transition-colors cursor-pointer text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Управление ценами</div>
                    <div className="text-[10px] text-muted-foreground">
                      Закупка (CNY) и продажа (UAH)
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* 3. Калькулятор валют */}
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                router.push(`/calculator?from=${encodeURIComponent(window.location.pathname)}`);
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-background/60 border border-border/40 hover:bg-foreground/5 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground">Калькулятор валют</div>
                  <div className="text-[10px] text-muted-foreground">
                    Конвертер курсов и расчет себестоимости
                  </div>
                </div>
              </div>
            </button>

            {/* 4. Выбрать все / Сброс выбора */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {onSelectAll && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onSelectAll();
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-xl text-xs font-bold h-9 gap-1.5 border-border/50 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Выбрать все
                </Button>
              )}
              {onClearSelection && hasSelection && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onClearSelection();
                    setIsMobileMenuOpen(false);
                  }}
                  className="rounded-xl text-xs font-bold h-9 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Сбросить
                </Button>
              )}
            </div>

            {/* 5. Нижняя панель: Переключатель темы и кнопка обновить */}
            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-muted-foreground">Тема:</span>
                <div className="glass p-0.5 rounded-xl border border-border/40">
                  <ModeToggle />
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="h-8 rounded-xl text-xs font-bold gap-1 border-border/50 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Обновить
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

