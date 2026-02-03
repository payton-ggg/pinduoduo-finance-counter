"use client";

import { Card } from "@/components/ui/card";
import { Wallet, TrendingDown, TrendingUp, Package } from "lucide-react";

type SummaryProps = {
  totalSpent: number;
  totalIncome: number;
  variationsCount: number;
};

export function Summary({
  totalSpent,
  totalIncome,
  variationsCount,
}: SummaryProps) {
  const profit = totalIncome - totalSpent;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      <Card className="p-4 flex flex-col justify-between space-y-2 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium">Расходы</span>
          <TrendingDown className="h-4 w-4 text-red-500" />
        </div>
        <div className="text-lg sm:text-2xl font-bold tracking-tight">
          {totalSpent.toLocaleString()}{" "}
          <span className="text-sm font-normal text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-2 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium">Доходы</span>
          <TrendingUp className="h-4 w-4 text-green-500" />
        </div>
        <div className="text-lg sm:text-2xl font-bold tracking-tight">
          {totalIncome.toLocaleString()}{" "}
          <span className="text-sm font-normal text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-2 hover:bg-muted/50 transition-colors bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between text-primary">
          <span className="text-xs sm:text-sm font-medium">Прибыль</span>
          <Wallet className="h-4 w-4" />
        </div>
        <div
          className={`text-lg sm:text-2xl font-bold tracking-tight ${
            profit >= 0 ? "text-primary" : "text-destructive"
          }`}
        >
          {profit.toLocaleString()}{" "}
          <span className="text-sm font-normal opacity-70">₴</span>
        </div>
      </Card>

      <Card className="p-4 flex flex-col justify-between space-y-2 hover:bg-muted/50 transition-colors">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-xs sm:text-sm font-medium">Товары</span>
          <Package className="h-4 w-4" />
        </div>
        <div className="text-lg sm:text-2xl font-bold tracking-tight">
          {variationsCount}
        </div>
      </Card>
    </div>
  );
}
