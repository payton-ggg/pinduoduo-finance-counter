"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Coins,
  CheckSquare,
  Square,
} from "lucide-react";

export type ProductUI = {
  id: string | number;
  name: string;
  img: string;
  spent: number;
  income: number;
  priceCNY: number;
  shippingUA?: number;
  managementUAH?: number;
  priceInUA?: number;
  totalPurchased?: number;
  archive?: number | null;
  rateCNY?: number;
  rateUSD?: number;
  folderId?: string | null;
  folderName?: string | null;
};

type ProductCardProps = {
  product: ProductUI;
  isSelected?: boolean;
  onToggle?: () => void;
  globalRate?: number;
};

export function ProductCard({
  product,
  isSelected,
  onToggle,
  globalRate,
}: ProductCardProps) {
  const balance = product.income - product.spent;

  // Projected Profit: (Total Stock * Selling Price) - Total Spent
  // This assumes 'spent' covers all costs for the batch.
  const projectedRevenue =
    (product.totalPurchased || 0) * (product.priceInUA || 0);
  const projectedProfit = projectedRevenue - product.spent;

  const margin = product.income - product.spent;

  const actualRateCNY = product.rateCNY || globalRate || 0;

  const purchaseCostUAH =
    actualRateCNY > 0 ? product.priceCNY * actualRateCNY : product.priceCNY * 1;

  const handleSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggle) onToggle();
  };

  return (
    <Card
      className={`group overflow-hidden glass-card h-full flex flex-col border-none shadow-lg transition-all duration-300 ${
        isSelected === false ? "opacity-60 grayscale-[0.5]" : ""
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-muted/20">
        <img
          src={product.img || "/placeholder.png"}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://placehold.co/400x300?text=No+Image";
          }}
        />

        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

        {onToggle && (
          <div
            onClick={handleSelection}
            className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 cursor-pointer transition-transform hover:scale-110 active:scale-95"
          >
            {isSelected ? (
              <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/30">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
              </div>
            ) : (
              <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-lg border border-white/20">
                <Square className="w-4 h-4 sm:w-5 sm:h-5 text-white/90" />
              </div>
            )}
          </div>
        )}

        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10">
          <div
            className={`flex items-center gap-1 sm:gap-1.5 rounded-xl sm:rounded-2xl px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-black text-white shadow-xl backdrop-blur-xl border border-white/20 ${
              balance >= 0 ? "bg-green-500/80" : "bg-red-500/80"
            }`}
          >
            {balance >= 0 ? (
              <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            ) : (
              <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
            {balance.toFixed(0)} ₴
          </div>
        </div>
      </div>

      <CardContent className="p-3 sm:p-5 space-y-3 sm:space-y-4 flex-1 flex flex-col relative">
        <div className="space-y-1.5">
          <h3 className="font-black text-base sm:text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
            <span className="inline-flex items-center gap-1 bg-secondary/50 backdrop-blur-md px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-secondary-foreground border border-secondary">
              <Coins className="w-3 h-3" />
              {actualRateCNY > 0
                ? `${product.priceCNY}¥ ≈ ${purchaseCostUAH.toFixed(0)}₴`
                : `${product.priceCNY}¥`}
            </span>
            {product.priceInUA && (
              <span className="inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-bold text-primary border border-primary/20">
                <TrendingUp className="w-3 h-3" />
                {product.priceInUA} ₴
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-2.5 sm:space-y-3">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-foreground/3 border border-foreground/5">
            <div className="space-y-0.5">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                Расход
              </span>
              <p className="font-black text-xs sm:text-sm text-foreground">
                {product.spent.toFixed(1)} ₴
              </p>
            </div>
            <div className="space-y-0.5 text-right border-l border-foreground/10 pl-2">
              <span className="text-[8px] sm:text-[9px] uppercase tracking-widest text-muted-foreground font-bold">
                Доход
              </span>
              <p className="font-black text-xs sm:text-sm text-foreground">
                {product.income.toFixed(1)} ₴
              </p>
            </div>
          </div>

          <div className="space-y-1.5 sm:space-y-2">
            {(product.totalPurchased || 0) > 0 && (
              <div className="flex justify-between items-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-[9px] sm:text-[10px] font-bold text-primary/70 uppercase">
                  Прогноз
                </span>
                <span
                  className={`text-[11px] sm:text-xs font-black ${projectedProfit >= 0 ? "text-primary" : "text-destructive"}`}
                >
                  {projectedProfit > 0 ? "+" : ""}
                  {projectedProfit.toFixed(0)} ₴
                </span>
              </div>
            )}

            <div className="flex justify-between items-center px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-foreground/3 border border-foreground/5">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase">
                Моржа
              </span>
              <span
                className={`text-[11px] sm:text-xs font-black ${margin >= 0 ? "text-primary" : "text-destructive"}`}
              >
                {margin.toFixed(0)} ₴
              </span>
            </div>
          </div>
        </div>

        {(product.shippingUA || product.managementUAH) && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 pt-2 border-t border-foreground/5">
            {product.shippingUA && (
              <span className="flex items-center gap-1">
                📦 {product.shippingUA}₴
              </span>
            )}
            {product.managementUAH && (
              <span className="flex items-center gap-1">
                ⚙️ {product.managementUAH}₴
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
