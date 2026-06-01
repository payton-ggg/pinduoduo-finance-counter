"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import * as htmlToImage from "html-to-image";
import { Card } from "@/components/ui/card";
import {
  Check,
  ExternalLink,
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  Copy,
  ChevronDown,
  Camera,
  Loader2,
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
  const [isExporting, setIsExporting] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);
    try {
      // Small delay to ensure styles and images are fully rendered
      await new Promise((resolve) => setTimeout(resolve, 300));
      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
      });
      const link = document.createElement("a");
      link.download = `statistics-${data?.name || "product"}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Failed to export image", error);
    } finally {
      setIsExporting(false);
    }
  };

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
  const roi =
    totals.totalCosts > 0
      ? (totals.totalPotentialRevenue / totals.totalCosts - 1) * 100
      : 0;
  const currentRoi =
    totals.totalCosts > 0
      ? (totals.totalIncome / totals.totalCosts - 1) * 100
      : 0;

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold truncate pr-4">
          {data?.name || "Детали продукта"}
        </h2>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="shrink-0 flex items-center gap-2 px-4 py-2 bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 active:translate-y-0 text-sm font-semibold"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          Сохранить фото
        </button>
      </div>

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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Версии ({variants.length})
            </h3>
            {variants.length > 1 && (
              <Link
                href={`/product/${data.id}/compare`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-transform hover:scale-105 active:scale-95"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Сравнить версии
              </Link>
            )}
          </div>
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

      {/* Hidden Export View */}
      <div className="overflow-hidden h-0 w-0 absolute left-[-9999px] top-[-9999px]">
        <div
          ref={exportRef}
          className="w-[800px] bg-linear-to-br from-slate-900 via-slate-800 to-indigo-950 p-8 rounded-3xl text-white font-sans flex flex-col gap-8 shadow-2xl relative"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          {/* Header */}
          <div className="flex gap-6 z-10">
            {images.length > 0 && (
              <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0 shadow-lg border-2 border-white/10 relative">
                {/* next/image doesn't play well with html2canvas sometimes, using img is safer, but next/image with unoptimized is also fine. We'll use standard img for export */}
                <img
                  src={images[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-black mb-2 line-clamp-2 leading-tight">
                {data?.name || "Отчет по товару"}
              </h1>
              {data?.folder && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm w-fit text-sm">
                  <Package className="w-4 h-4" />
                  Папка: {data.folder.name}
                </div>
              )}
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 z-10">
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <p className="text-white/60 text-sm font-medium mb-1">
                Доход (чистый)
              </p>
              <p className="text-2xl font-bold text-green-400">
                {totals.totalIncome.toFixed(2)} ₴
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <p className="text-white/60 text-sm font-medium mb-1">
                Расходы (всего)
              </p>
              <p className="text-2xl font-bold text-rose-400">
                {totals.totalCosts.toFixed(2)} ₴
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <p className="text-white/60 text-sm font-medium mb-1">
                Продано / Куплено
              </p>
              <p className="text-2xl font-bold text-blue-400">
                {totals.totalSells} <span className="text-white/40">/</span>{" "}
                {totals.totalPurchased}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <p className="text-white/60 text-sm font-medium mb-1">Остаток</p>
              <p className="text-2xl font-bold text-orange-400">
                {remainingStock} шт
              </p>
            </div>
          </div>

          {/* ROI & Projections */}
          <div className="grid grid-cols-2 gap-4 z-10">
            <div className="bg-linear-to-br from-green-500/20 to-emerald-600/10 backdrop-blur-md rounded-2xl p-6 border border-green-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <p className="text-green-300/80 text-sm font-medium mb-2 uppercase tracking-wider">
                Прогноз прибыли
              </p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-green-400">
                  +{potentialProfit.toFixed(2)} ₴
                </p>
                <p className="text-green-300 font-bold mb-1 bg-green-500/20 px-2 py-1 rounded-lg">
                  ROI {roi.toFixed(1)}%
                </p>
              </div>
              <p className="text-green-400/60 text-sm mt-2">
                Если продать все {totals.totalPurchased} шт
              </p>
            </div>

            <div className="bg-linear-to-br from-blue-500/20 to-indigo-600/10 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl translate-x-1/2 -translate-y-1/2" />
              <p className="text-blue-300/80 text-sm font-medium mb-2 uppercase tracking-wider">
                Текущая Маржа
              </p>
              <div className="flex items-end gap-3">
                <p className="text-4xl font-black text-blue-400">
                  {margin > 0 ? "+" : ""}
                  {margin.toFixed(2)} ₴
                </p>
                <p className="text-blue-300 font-bold mb-1 bg-blue-500/20 px-2 py-1 rounded-lg">
                  Текущий ROI {currentRoi.toFixed(1)}%
                </p>
              </div>
              <p className="text-blue-400/60 text-sm mt-2">
                Продано {totals.totalSells} из {totals.totalPurchased} шт
              </p>
            </div>
          </div>

          {/* Variants Summary */}
          {variants.length > 0 && (
            <div className="z-10 bg-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/10 shadow-lg">
              <h3 className="text-white/80 font-bold mb-4 uppercase tracking-wider text-sm flex items-center gap-2">
                <Package className="w-4 h-4" />
                Версии товара ({variants.length})
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {variants.map((v: any, i: number) => {
                  if (v.isIncluded === false) return null;
                  const priceCNY = Number(v.priceCNY) || 0;
                  const priceInUA = Number(v.priceInUA) || 0;
                  const purchased = Number(v.purchasedCount) || 0;
                  const sells = Number(v.sellsCount) || 0;

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                    >
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          Версия {i + 1}
                        </span>
                        <span className="text-white/50 text-xs truncate max-w-[200px]">
                          {v.pddSearchQuery || "Без названия"}
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex flex-col items-end">
                          <span className="text-white/60 text-xs">Закупка</span>
                          <span className="text-white font-semibold">
                            {priceCNY} ¥
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-white/60 text-xs">Продажа</span>
                          <span className="text-white font-semibold">
                            {priceInUA > 0 ? `${priceInUA} ₴` : "—"}
                          </span>
                        </div>
                        <div className="flex flex-col items-end min-w-[80px]">
                          <span className="text-white/60 text-xs">
                            Куплено/Продано
                          </span>
                          <span className="text-white font-semibold">
                            {purchased} / {sells}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer watermark */}
          <div className="flex justify-between items-center z-10 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <span className="font-bold tracking-tight text-white/80">
                Pinduoduo Analytics
              </span>
            </div>
            <div className="text-white/40 text-sm font-medium">
              Сгенерировано {new Date().toLocaleDateString("ru-RU")}
            </div>
          </div>
        </div>
      </div>
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
