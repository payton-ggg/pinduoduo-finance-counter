"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 glass-card mb-8">
      <div className="space-y-1 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
          📦 China <span className="text-primary">Manager</span>
        </h1>
        <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Control Panel v2.0
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
          <div className="glass p-1 rounded-2xl">
            <ModeToggle />
          </div>

          <div className="flex items-center gap-2">
            {onSelectAll && (
              <Button
                variant="outline"
                onClick={onSelectAll}
                className="glass rounded-xl font-black border-none hover:bg-primary/20 transition-all text-xs px-4 h-11"
              >
                Выбрать все
              </Button>
            )}
            {onClearSelection && hasSelection && (
              <Button
                variant="outline"
                onClick={onClearSelection}
                className="glass rounded-xl font-black border-none hover:bg-destructive/20 transition-all text-destructive text-xs px-4 h-11"
              >
                Сброс
              </Button>
            )}
          </div>
        </div>

        <Button
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl font-black px-6 h-11 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          onClick={onAdd}
        >
          <Plus className="w-5 h-5" /> Добавить товар
        </Button>
      </div>
    </div>
  );
}
