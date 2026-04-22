"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
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
      className={`group overflow-hidden glass-card h-full flex flex-col border-none ${
        isSelected === false ? "opacity-60 grayscale-[0.5]" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <img
          src={product.img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Futuristic Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Selection Checkbox */}
        {onToggle && (
          <div
            onClick={handleSelection}
            className="absolute top-3 left-3 z-20 cursor-pointer transition-transform hover:scale-110 active:scale-95"
          >
            {isSelected ? (
              <div className="bg-primary p-1 rounded-lg shadow-lg shadow-primary/20">
                <CheckSquare className="w-5 h-5 text-primary-foreground" />
              </div>
            ) : (
              <div className="bg-black/20 backdrop-blur-md p-1 rounded-lg border border-white/20">
                <Square className="w-5 h-5 text-white/80" />
              </div>
            )}
          </div>
        )}

        <div className="absolute top-3 right-3 z-10">
          <div className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-xs font-black text-white shadow-xl backdrop-blur-xl border border-white/20 ${
            balance >= 0 ? "bg-green-500/80" : "bg-red-500/80"
          }`}>
            {balance >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {balance.toFixed(0)} ₴
          </div>
        </div>
      </div>

      <CardContent className="p-5 space-y-4 flex-1 flex flex-col relative">
        <div className="space-y-1.5">
          <h3 className="font-black text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="inline-flex items-center gap-1.5 bg-secondary/50 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] font-bold text-secondary-foreground border border-secondary">
              <Coins className="w-3 h-3" />
              {actualRateCNY > 0
                ? `${product.priceCNY}¥ ≈ ${purchaseCostUAH.toFixed(0)}₴`
                : `${product.priceCNY}¥`}
            </span>
            {product.priceInUA && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary border border-primary/20">
                <TrendingUp className="w-3 h-3" />
                {product.priceInUA} ₴
              </span>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-3">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-foreground/[0.03] border border-foreground/[0.05]">
            <div className="space-y-0.5">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Расход</span>
              <p className="font-black text-sm text-foreground">{product.spent.toFixed(2)} ₴</p>
            </div>
            <div className="space-y-0.5 text-right border-l border-foreground/10 pl-2">
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Доход</span>
              <p className="font-black text-sm text-foreground">{product.income.toFixed(2)} ₴</p>
            </div>
          </div>

          {/* Profit Badges */}
          <div className="space-y-2">
            {(product.totalPurchased || 0) > 0 && (
              <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-[10px] font-bold text-primary/70 uppercase">Прогноз</span>
                <span className={`text-xs font-black ${projectedProfit >= 0 ? "text-primary" : "text-destructive"}`}>
                  {projectedProfit > 0 ? "+" : ""}{projectedProfit.toFixed(2)} ₴
                </span>
              </div>
            )}

            <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/[0.05]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Моржа</span>
              <span className={`text-xs font-black ${margin >= 0 ? "text-primary" : "text-destructive"}`}>
                {margin.toFixed(2)} ₴
              </span>
            </div>
          </div>
        </div>

        {/* Floating Details */}
        {(product.shippingUA || product.managementUAH) && (
          <div className="flex gap-3 text-[10px] font-bold text-muted-foreground/60 pt-2 border-t border-foreground/5">
            {product.shippingUA && <span className="flex items-center gap-1">📦 {product.shippingUA}₴</span>}
            {product.managementUAH && <span className="flex items-center gap-1">⚙️ {product.managementUAH}₴</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
