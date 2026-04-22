import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Package,
  Sparkles,
} from "lucide-react";

type SummaryProps = {
  totalSpent: number;
  totalIncome: number;
  totalProjectedRevenue: number;
  totalProjectedProfit: number;
  variationsCount: number;
};

export function Summary({
  totalSpent,
  totalIncome,
  totalProjectedRevenue,
  totalProjectedProfit,
  variationsCount,
}: SummaryProps) {
  const [showGross, setShowGross] = useState(false);
  const profit = totalIncome - totalSpent;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Расходы
          </span>
          <div className="p-2 bg-red-500/10 rounded-xl">
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {totalSpent.toLocaleString()}{" "}
          <span className="text-sm font-medium text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Доходы
          </span>
          <div className="p-2 bg-green-500/10 rounded-xl">
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {totalIncome.toLocaleString()}{" "}
          <span className="text-sm font-medium text-muted-foreground">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3 relative overflow-hidden group">
        <div className="absolute -top-3 -left-4 w-120 h-120 bg-primary/5 group-hover:bg-primary/10 transition-colors" />
        <div className="flex items-center justify-between text-primary relative z-10">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Прибыль
          </span>
          <div className="p-2 bg-primary/10 rounded-xl">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div
          className={`text-xl sm:text-2xl font-black tracking-tight relative z-10 ${
            profit >= 0 ? "text-primary" : "text-destructive"
          }`}
        >
          {profit.toLocaleString()}{" "}
          <span className="text-sm font-medium opacity-70">₴</span>
        </div>
      </Card>

      <Card
        onClick={() => setShowGross(!showGross)}
        className="p-5 glass-card flex flex-col justify-between space-y-3 cursor-pointer group hover:border-primary/40 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="w-3 h-3 text-primary animate-pulse" />
        </div>
        <div className="flex items-center justify-between text-primary">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Прогноз {showGross ? "(Грязными)" : "(Чистыми)"}
          </span>
          <div className="p-2 bg-primary/10 rounded-xl transition-transform group-hover:rotate-12">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-primary">
          {showGross
            ? totalProjectedRevenue.toLocaleString()
            : totalProjectedProfit.toLocaleString()}{" "}
          <span className="text-sm font-medium opacity-70">₴</span>
        </div>
      </Card>

      <Card className="p-5 glass-card flex flex-col justify-between space-y-3">
        <div className="flex items-center justify-between text-muted-foreground/80">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider">
            Товары
          </span>
          <div className="p-2 bg-blue-500/10 rounded-xl">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
        </div>
        <div className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
          {variationsCount}
        </div>
      </Card>
    </div>
  );
}
