"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type HeaderProps = {
  onAdd?: () => void;
};

export function Header({ onAdd }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold">🎧 My Headphones Manager</h1>
      <Button className="flex items-center gap-2" onClick={onAdd}>
        <Plus className="w-4 h-4" /> Add Variation
      </Button>
    </div>
  );
}