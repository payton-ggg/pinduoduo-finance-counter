"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModeToggle } from "@/components/ui/mode-toggle";

type HeaderProps = {
  onAdd?: () => void;
};

export function Header({ onAdd }: HeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl sm:text-3xl font-bold">
        🎧 My Headphones Manager
      </h1>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <Button className="flex items-center gap-2" onClick={onAdd}>
          <Plus className="w-4 h-4" /> Add Variation
        </Button>
      </div>
    </div>
  );
}
