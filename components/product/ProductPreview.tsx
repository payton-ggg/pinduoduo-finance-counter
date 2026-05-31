"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import {
  Check,
  X,
  ExternalLink,
  Package,
  TrendingUp,
  TrendingDown,
  Truck,
  Weight,
  ShoppingCart,
  BarChart3,
  Copy,
  ChevronDown,
} from "lucide-react";

type ProductPreviewProps = {
  data: any;
  rates?: { cny?: number; usd?: number };
};

export function ProductPreview({ data, rates }: ProductPreviewProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const images: string[] = Array.isArray(data?.images)
    ? data.images
        .map((img: any) => (typeof img === "string" ? img : (img?.url ?? "")))
        .filter(Boolean)
    : [];

  const variants: any[] = Array.isArray(data?.variants) ? data.variants : [];

  const totals = variants.reduce(
    (acc, v) => {
      if (v.isIncluded === false) return acc;

      const rateCNY = v.rateCNY || rates?.cny || 0;
      const rateUSD = v.rateUSD || rates?.usd || 0;
      const priceCNY = Number(v.priceCNY) || 0;
      const priceInUA = Number(v.priceInUA) || 0;
      const purchased = Number(v.purchasedCount) || 0;
      const sells = Number(v.sellsCount) || 0;
      const shippingUA = Number(v.shippingUA) || 0;
      const managementUAH = Number(v.managementUAH) || 0;
      const unitWeight = Number(v.weight) || 0;

      const purchaseUnitCostUAH = priceCNY * (rateCNY > 0 ? rateCNY : 1);
      const goodsCost = purchased * purchaseUnitCostUAH;
      const actualNetPrice =
        v.netPrice || (priceInUA > 0 ? priceInUA * 0.98 - 20 : 0);
      const income = sells * actualNetPrice;
      const costs = goodsCost + shippingUA + managementUAH;

      acc.totalPurchased += purchased;
      acc.totalSells += sells;
      acc.totalIncome += income;
      acc.totalCosts += costs;
      acc.totalPotentialRevenue += purchased * actualNetPrice;
      acc.totalWeight += unitWeight * purchased;
      return acc;
    },
    {
      totalPurchased: 0,
      totalSells: 0,
      totalIncome: 0,
      totalCosts: 0,
      totalPotentialRevenue: 0,
      totalWeight: 0,
    },
  );

  const potentialProfit = totals.totalPotentialRevenue - totals.totalCosts;
  const margin = totals.totalIncome - totals.totalCosts;
  const remainingStock = totals.totalPurchased - totals.totalSells;

  return (
    <div className="space-y-6">
      {images.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((url, i) => (
            <div
              key={i}
              className="relative h-48 w-48 shrink-0 rounded-xl border shadow-sm overflow-hidden bg-muted/20"
            >
              <Image
                src={url}
                alt={`${data?.name || "Product"} ${i + 1}`}
                fill
                sizes="192px"
                className="object-cover object-center"
              />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-green-500" />}
          label="Доход (текущий, чистый)"
          value={`${totals.totalIncome.toFixed(2)} ₴`}
          large
        />
        <StatCard
          icon={<TrendingDown className="h-5 w-5 text-red-500" />}
          label="Расходы (всего)"
          value={`${totals.totalCosts.toFixed(2)} ₴`}
          large
        />
        <StatCard
          icon={<ShoppingCart className="h-5 w-5 text-blue-500" />}
          label="Продано / Куплено"
          value={`${totals.totalSells} / ${totals.totalPurchased}`}
          large
        />
        <StatCard
          icon={<Package className="h-5 w-5 text-orange-500" />}
          label="Остаток на складе"
          value={`${remainingStock} шт`}
          large
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`p-5 border-2 ${potentialProfit >= 0 ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-red-500/30 bg-red-50/50 dark:bg-red-950/20"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Прогноз прибыли (если продать все {totals.totalPurchased} шт)
            </p>
          </div>
          <p
            className={`text-3xl font-bold ${potentialProfit >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {potentialProfit >= 0 ? "+" : ""}
            {potentialProfit.toFixed(2)} ₴
          </p>
        </Card>
        <Card
          className={`p-5 border-2 relative ${margin >= 0 ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20"}`}
        >
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground font-medium">
              Маржа ({totals.totalSells} из {totals.totalPurchased} шт)
            </p>
          </div>
          <p
            className={`text-3xl font-bold ${margin >= 0 ? "text-green-600" : "text-orange-600"}`}
          >
            {margin >= 0 ? "+" : ""}
            {margin.toFixed(2)} ₴
          </p>
        </Card>
      </div>

      {/* Variants detail */}
      {variants.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Версии ({variants.length})
          </h3>
          {variants.length > 0 &&
            (() => {
              const v = variants[activeVariantIndex] || variants[0];
              const i = activeVariantIndex;
              const rateCNY = v.rateCNY || rates?.cny || 0;
              const priceCNY = Number(v.priceCNY) || 0;
              const priceInUA = Number(v.priceInUA) || 0;
              const purchased = Number(v.purchasedCount) || 0;
              const sells = Number(v.sellsCount) || 0;
              const shippingUA = Number(v.shippingUA) || 0;
              const managementUAH = Number(v.managementUAH) || 0;
              const unitWeight = Number(v.weight) || 0;
              const purchaseUAH = priceCNY * (rateCNY > 0 ? rateCNY : 1);

              const shippingLabel =
                v.shippingType === "sea"
                  ? "Море (7.1$/кг)"
                  : v.shippingType === "custom"
                    ? `Своя (${v.customShippingRate || 0}$/кг)`
                    : "Авиа (18.3$/кг)";

              return (
                <div
                  className="border border-foreground/10 rounded-xl overflow-hidden relative bg-card shadow-sm"
                  onTouchStart={(e) =>
                    setTouchStart(e.targetTouches[0].clientX)
                  }
                  onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
                  onTouchEnd={() => {
                    if (!touchStart || !touchEnd) return;
                    const distance = touchStart - touchEnd;
                    if (
                      distance > 50 &&
                      activeVariantIndex < variants.length - 1
                    )
                      setActiveVariantIndex((prev) => prev + 1);
                    if (distance < -50 && activeVariantIndex > 0)
                      setActiveVariantIndex((prev) => prev - 1);
                    setTouchStart(null);
                    setTouchEnd(null);
                  }}
                >
                  {/* Carousel Header / Navigation */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-foreground/3 border-b border-foreground/5 gap-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        className="flex items-center justify-center h-8 w-8 rounded-md border bg-background hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        disabled={activeVariantIndex === 0}
                        onClick={() =>
                          setActiveVariantIndex((prev) => prev - 1)
                        }
                      >
                        <ChevronDown className="h-4 w-4 rotate-90" />
                      </button>

                      <div className="flex flex-col items-center sm:items-start overflow-hidden">
                        <span className="text-sm font-bold truncate">
                          Версия {activeVariantIndex + 1} из {variants.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        className="flex items-center justify-center h-8 w-8 rounded-md border bg-background hover:bg-muted disabled:opacity-50 disabled:pointer-events-none transition-colors"
                        disabled={activeVariantIndex === variants.length - 1}
                        onClick={() =>
                          setActiveVariantIndex((prev) => prev + 1)
                        }
                      >
                        <ChevronDown className="h-4 w-4 -rotate-90" />
                      </button>
                    </div>

                    {v.isIncluded === false && (
                      <span className="text-xs font-semibold bg-muted/50 border border-foreground/10 text-muted-foreground px-2.5 py-1 rounded-md truncate">
                        Исключена из расчета
                      </span>
                    )}
                  </div>

                  <div
                    className={`p-4 bg-background/30 transition-all ${v.isIncluded === false ? "opacity-60 grayscale-20" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold">Детали</h4>
                      {v.pddSearchQuery && (
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            PDD: {v.pddSearchQuery}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(v.pddSearchQuery, `pdd-${i}`)
                            }
                            className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors bg-background border shadow-sm ml-2"
                          >
                            {copiedField === `pdd-${i}` ? (
                              <Check className="h-3.5 w-3.5 text-green-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-6 text-sm">
                      <InfoRow
                        label="Закупка"
                        value={`${priceCNY} ¥ ≈ ${purchaseUAH.toFixed(2)} ₴`}
                      />
                      <InfoRow
                        label="Продажа"
                        value={priceInUA > 0 ? `${priceInUA} ₴` : "—"}
                      />
                      <InfoRow
                        label="Куплено / Продано"
                        value={`${purchased} / ${sells}`}
                      />
                      {unitWeight > 0 && (
                        <InfoRow
                          label="Вес"
                          value={
                            unitWeight > 1000
                              ? `${(unitWeight / 1000).toFixed(3)} кг`
                              : `${unitWeight} г`
                          }
                        />
                      )}
                      <InfoRow
                        label="Доставка"
                        value={`${shippingUA.toFixed(2)} ₴`}
                        sub={shippingLabel}
                      />
                      <InfoRow
                        label="Управление"
                        value={`${managementUAH.toFixed(2)} ₴`}
                      />
                    </div>
                  </div>
                </div>
              );
            })()}
        </Card>
      )}

      {data?.pinduoduoUrl && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Ссылки
          </h3>
          <div className="flex items-center gap-1">
            <a
              href={data.pinduoduoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm font-medium"
            >
              <ExternalLink className="h-4 w-4" />
              Pinduoduo
            </a>
            <button
              type="button"
              onClick={() => handleCopy(data.pinduoduoUrl, "pinduoduoUrl")}
              className="p-2 rounded-lg border hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
              title="Скопировать ссылку"
            >
              {copiedField === "pinduoduoUrl" ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </Card>
      )}

      {data?.folder && (
        <div className="text-sm text-muted-foreground">
          Папка:{" "}
          <span className="font-medium text-foreground">
            {data.folder.name}
          </span>
        </div>
      )}

      {data?.expenses && data.expenses.length > 0 && (
        <Card className="p-5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            Детальные расходы
          </h3>
          <div className="space-y-2">
            {data.expenses.map((exp: any, i: number) => (
              <div
                key={exp.id || i}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <span className="text-sm">{exp.type || "Без типа"}</span>
                <span className="font-semibold">
                  {Number(exp.amount).toFixed(2)} ₴
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  large,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <Card className="p-4 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={`font-bold ${large ? "text-xl sm:text-2xl" : "text-lg"}`}>
        {value}
      </p>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
