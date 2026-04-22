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
    <div className="flex flex-wrap items-center justify-between gap-4 p-6 glass-card mb-8">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-4xl font-black tracking-tighter text-foreground bg-clip-text">
          🎧 Headset <span className="text-primary">Manager</span>
        </h1>
        <p className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">
          Control Panel v2.0
        </p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="glass p-1 rounded-2xl flex gap-1">
          <ModeToggle />
        </div>
        
        <div className="flex items-center gap-2">
          {onSelectAll && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSelectAll}
              className="glass rounded-xl font-bold border-none hover:bg-primary/20 transition-all"
            >
              Select All
            </Button>
          )}
          {onClearSelection && hasSelection && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClearSelection}
              className="glass rounded-xl font-bold border-none hover:bg-destructive/20 transition-all text-destructive"
            >
              Clear
            </Button>
          )}
        </div>

        <Button 
          className="flex items-center gap-2 rounded-2xl font-black px-6 py-6 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all" 
          onClick={onAdd}
        >
          <Plus className="w-5 h-5" /> Add New Item
        </Button>
      </div>
    </div>
  );
}
