"use client";

import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

type HeaderProps = {
  onAdd?: () => void;
  onClearSelection?: () => void;
  onSelectAll?: () => void;
  hasSelection?: boolean;
};

export function Header({
  onAdd,
  onClearSelection,
  onSelectAll,
  hasSelection,
}: HeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 p-4 sm:p-6 glass-card mb-8">
      <div className="space-y-0.5 sm:space-y-1 text-center sm:text-left">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground whitespace-nowrap">
          📦 China <span className="text-primary">Manager</span>
        </h1>
        <p className="text-[9px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Control Panel v2.0
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <div className="glass p-1 rounded-2xl">
            <ModeToggle />
          </div>

          <div className="flex items-center gap-2 flex-1 sm:flex-none">
            {onSelectAll && (
              <Button
                variant="outline"
                onClick={onSelectAll}
                className="glass rounded-xl font-black border-none hover:bg-primary/20 transition-all text-[10px] sm:text-xs px-3 sm:px-4 h-10 sm:h-11 flex-1 sm:flex-none"
              >
                Выбрать все
              </Button>
            )}
            {onClearSelection && hasSelection && (
              <Button
                variant="outline"
                onClick={onClearSelection}
                className="glass rounded-xl font-black border-none hover:bg-destructive/20 transition-all text-destructive text-[10px] sm:text-xs px-3 sm:px-4 h-10 sm:h-11 flex-1 sm:flex-none"
              >
                Сброс
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => window.location.reload()}
            className="glass rounded-xl border-none hover:bg-primary/20 transition-all h-10 sm:h-11 w-10 sm:w-11 shrink-0 flex items-center justify-center group"
            title="Обновить данные"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 group-hover:rotate-180 transition-transform duration-500" />
          </Button>

          <Button
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-xl font-black px-4 sm:px-6 h-10 sm:h-11 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-sm sm:text-base"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Добавить товар
          </Button>
        </div>
      </div>
    </div>
  );
}
