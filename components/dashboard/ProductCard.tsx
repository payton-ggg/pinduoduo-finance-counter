"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Coins } from "lucide-react";

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
};

type ProductCardProps = {
  product: ProductUI;
};

export function ProductCard({ product }: ProductCardProps) {
  const [rate, setRate] = useState(0);
  const balance = product.income - product.spent;

  useEffect(() => {
    // Only fetch if we really need to display dynamic CNY conversion client-side,
    // but usually this is better passed from parent or context.
    // Keeping local for now to preserve existing logic.
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
    rate > 0 ? product.priceCNY * rate : product.priceCNY * 1; // fallback if no rate

  return (
    <Card className="group overflow-hidden rounded-xl border-border/50 bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300 h-full flex flex-col">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={product.img}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2">
          {balance >= 0 ? (
            <div className="flex items-center gap-1 rounded-full bg-green-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
              <TrendingUp className="h-3 w-3" />
              {balance.toFixed(0)} ₴
            </div>
          ) : (
            <div className="flex items-center gap-1 rounded-full bg-red-500/90 px-2 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md">
              <TrendingDown className="h-3 w-3" />
              {balance.toFixed(0)} ₴
            </div>
          )}
        </div>
      </div>

      <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
        <div>
          <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground flex gap-2 mt-1 items-center flex-wrap">
            <span className="flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded text-[10px]">
              <Coins className="w-3 h-3" />
              {rate > 0
                ? `${product.priceCNY}¥ ≈ ${purchaseCostUAH.toFixed(0)}₴`
                : `${product.priceCNY}¥`}
            </span>
            {product.priceInUA && (
              <span className="flex items-center gap-1 text-primary font-medium text-[10px]">
                <TrendingUp className="w-3 h-3" />
                Продажа: {product.priceInUA} ₴
              </span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg mt-auto">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase opacity-70">Расходы</span>
            <span className="font-semibold text-foreground">
              {product.spent.toLocaleString()} ₴
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] uppercase opacity-70">Доходы</span>
            <span className="font-semibold text-foreground">
              {product.income.toLocaleString()} ₴
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
