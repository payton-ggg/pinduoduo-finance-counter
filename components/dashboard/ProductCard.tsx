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
};

type ProductCardProps = {
  product: ProductUI;
  isSelected?: boolean;
  onToggle?: () => void;
};

export function ProductCard({
  product,
  isSelected,
  onToggle,
}: ProductCardProps) {
  const [rate, setRate] = useState(0);
  const balance = product.income - product.spent;

  // Projected Profit: (Total Stock * Selling Price) - Total Spent
  // This assumes 'spent' covers all costs for the batch.
  const projectedRevenue =
    (product.totalPurchased || 0) * (product.priceInUA || 0);
  const projectedProfit = projectedRevenue - product.spent;

  const margin = product.income - product.spent;

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json"
        );
        const data = await res.json();
        if (data && data.length > 0) setRate(data[0].rate);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRate();
  }, []);

  const purchaseCostUAH =
    rate > 0 ? product.priceCNY * rate : product.priceCNY * 1;

  const handleSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggle) onToggle();
  };

  return (
    <Card
      className={`group overflow-hidden rounded-xl border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col ${
        isSelected === false ? "opacity-60 grayscale-[0.5]" : ""
      }`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={product.img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Selection Checkbox */}
        {onToggle && (
          <div
            onClick={handleSelection}
            className="absolute top-2 left-2 z-20 cursor-pointer text-black  drop-shadow-md hover:scale-110 transition-transform"
          >
            {isSelected ? (
              <CheckSquare className="w-6 h-6 fill-primary stroke-black" />
            ) : (
              <Square className="w-6 h-6 stroke-black/80 fill-black/20" />
            )}
          </div>
        )}

        <div className="absolute top-2 right-2 z-10">
          {balance >= 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              <TrendingUp className="h-4 w-4" />
              {balance.toFixed(0)} ₴
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-red-500/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
              <TrendingDown className="h-4 w-4" />
              {balance.toFixed(0)} ₴
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex flex-col gap-1 mt-1.5">
            <p className="text-sm text-muted-foreground flex gap-2 items-center">
              <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                <Coins className="w-3.5 h-3.5" />
                {rate > 0
                  ? `${product.priceCNY}¥ ≈ ${purchaseCostUAH.toFixed(0)}₴`
                  : `${product.priceCNY}¥`}
              </span>
            </p>
            {product.priceInUA && (
              <p className="flex items-center gap-1 text-primary font-medium text-sm">
                <TrendingUp className="w-3.5 h-3.5" />
                Продажа: {product.priceInUA} ₴
              </p>
            )}
          </div>
        </div>

        <div className="mt-auto space-y-2">
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-lg">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase opacity-70 font-semibold">
                Расходы
              </span>
              <span className="font-bold text-foreground">
                {product.spent.toFixed(2)} ₴
              </span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-[10px] uppercase opacity-70 font-semibold">
                Доходы
              </span>
              <span className="font-bold text-foreground">
                {product.income.toFixed(2)} ₴
              </span>
            </div>
          </div>

          {/* Projected Profit Pill */}
          {(product.totalPurchased || 0) > 0 && (
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-primary/80">
                Прогноз (100% продаж)
              </span>
              <span
                className={`text-sm font-bold ${
                  projectedProfit >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {projectedProfit > 0 ? "+" : ""}
                {projectedProfit.toFixed(2)} ₴
              </span>
            </div>
          )}

            <div className="bg-primary/5 border border-primary/10 rounded-lg p-2 flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-primary/80">
                Моржа
              </span>
              <span
                className={`text-sm font-bold ${
                  margin >= 0 ? "text-primary" : "text-destructive"
                }`}
              >
                {margin.toFixed(2)} ₴
              </span>
            </div>
        </div>

        {/* Detail text - only show if exists */}
        {(product.shippingUA || product.managementUAH) && (
          <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground/60 pt-1">
            {product.shippingUA && <span>📦 {product.shippingUA}₴</span>}
            {product.managementUAH && <span>⚙️ {product.managementUAH}₴</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
