"use client";

import { useState, useRef, useEffect } from "react";
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
  Share2,
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
  const [exportImages, setExportImages] = useState<string[]>([]);
  const [exportedImageUri, setExportedImageUri] = useState<string | null>(null);
  const [shareSupported, setShareSupported] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      setShareSupported(true);
    }
  }, []);

  const images: string[] = Array.isArray(data?.images)
    ? data.images
        .map((img: any) => (typeof img === "string" ? img : (img?.url ?? "")))
        .filter(Boolean)
    : [];

  const variants: any[] = Array.isArray(data?.variants) ? data.variants : [];

  const displayImages = exportImages.length > 0 ? exportImages : images;

  const handleShare = async () => {
    if (!exportedImageUri) return;
    try {
      const response = await fetch(exportedImageUri);
      const blob = await response.blob();
      const file = new File(
        [blob],
        `statistics-${data?.name || "product"}.png`,
        { type: "image/png" },
      );

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Статистика - ${data?.name || "product"}`,
          text: `Отчет по товару ${data?.name || ""}`,
        });
      } else {
        await navigator.share({
          title: `Статистика - ${data?.name || "product"}`,
          text: `Отчет по товару ${data?.name || ""}`,
          url: window.location.href,
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Convert active images to base64 to prevent CORS taint and Safari rendering issues
      const activeImages = images.slice(0, 3);
      const base64Images = await Promise.all(
        activeImages.map(async (url) => {
          try {
            const res = await fetch(url, { mode: "cors" });
            const blob = await res.blob();
            return new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.error("CORS fetch failed, using fallback URL:", url, e);
            return url;
          }
        }),
      );

      setExportImages(base64Images);

      // 2. Wait for state and DOM to update
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (!exportRef.current) return;

      // 3. For Safari, call html-to-image twice to prime rendering cache
      await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
      });

      const dataUrl = await htmlToImage.toPng(exportRef.current, {
        pixelRatio: 2,
        backgroundColor: "transparent",
      });

      // 4. Handle saving based on device type
      const isMobileDevice = typeof window !== "undefined" && 
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobileDevice) {
        setExportedImageUri(dataUrl);
      } else {
        const link = document.createElement("a");
        link.download = `statistics-${data?.name || "product"}.png`;
        link.href = dataUrl;
        link.click();
      }
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
      acc.totalGoodsCostUAH += goodsCost;
      acc.totalShippingUAH += shippingUA;
      return acc;
    },
    {
      totalPurchased: 0,
      totalSells: 0,
      totalIncome: 0,
      totalCosts: 0,
      totalPotentialRevenue: 0,
      totalWeight: 0,
      totalGoodsCostUAH: 0,
      totalShippingUAH: 0,
    },
  );

  const potentialProfit = totals.totalPotentialRevenue - totals.totalCosts;
  const margin = totals.totalIncome - totals.totalCosts;
  const remainingStock = totals.totalPurchased - totals.totalSells;
  const totalShippingUSD = rates?.usd ? totals.totalShippingUAH / rates.usd : 0;

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
          className="w-[1000px] bg-white text-slate-900 flex rounded-none border border-slate-200"
        >
          {/* Left Column: Ambient Background + Images + Overlay */}
          <div className="w-[420px] shrink-0 relative overflow-hidden flex flex-col bg-slate-900">
            {/* Ambient background matching product image */}
            {displayImages.length > 0 && (
              <div className="absolute inset-0 z-0 bg-black overflow-hidden">
                <img
                  src={displayImages[0]}
                  alt=""
                  className="w-full h-full object-cover blur-[50px] opacity-60 scale-[2] saturate-150"
                  crossOrigin="anonymous"
                />
              </div>
            )}

            {/* Images Container */}
            {displayImages.length > 0 ? (
              <div className="w-full h-full flex flex-col absolute inset-0 z-10">
                <img
                  src={displayImages[0]}
                  alt=""
                  className="w-full h-auto object-cover shrink-0"
                  style={{
                    maxHeight: displayImages.length > 1 ? "60%" : "100%",
                  }}
                  crossOrigin="anonymous"
                />
                {displayImages.length > 1 && (
                  <div
                    className={`grid ${displayImages.length === 2 ? "grid-cols-1" : "grid-cols-2"} gap-0 w-full flex-1 min-h-0`}
                  >
                    {displayImages.slice(1, 3).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-800">
                <Package className="w-20 h-20 text-slate-400" />
              </div>
            )}

            {/* Dark Overlay at bottom for text */}
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-black/0 flex flex-col justify-end p-8 z-20 pointer-events-none">
              {data?.folder && (
                <div className="text-white/80 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  {data.folder.name}
                </div>
              )}
              <h1
                className="text-3xl font-black text-white leading-tight mb-4"
                style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.8)" }}
              >
                {data?.name || "Отчет по товару"}
              </h1>

              <div className="flex flex-col gap-2 mt-2 p-4 bg-slate-950/85 rounded-xl border border-white/10 pointer-events-auto">
                <div className="flex justify-between items-center text-white">
                  <span className="text-white/80 text-sm font-medium">
                    Сумма за товары
                  </span>
                  <span className="font-bold text-lg">
                    {totals.totalGoodsCostUAH.toFixed(2)} ₴
                  </span>
                </div>
                <div className="flex justify-between items-center text-white">
                  <span className="text-white/80 text-sm font-medium">
                    Доставка
                  </span>
                  <div className="flex items-end gap-2">
                    <span className="font-bold text-lg">
                      {totals.totalShippingUAH.toFixed(2)} ₴
                    </span>
                    {totalShippingUSD > 0 && (
                      <span className="text-white/50 text-sm font-medium mb-[2px]">
                        (${totalShippingUSD.toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="w-[580px] p-10 flex flex-col bg-slate-50">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
                <span className="text-xl font-black tracking-tight text-slate-800">
                  Pinduoduo Analytics
                </span>
              </div>
              <div className="text-slate-500 text-sm font-medium">
                {new Date().toLocaleDateString("ru-RU")}
              </div>
            </div>

            <div className="flex flex-col gap-5 flex-1">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Доход (чистый)
                  </span>
                  <span className="text-2xl font-black text-green-600">
                    {totals.totalIncome.toFixed(2)} ₴
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Расходы (всего)
                  </span>
                  <span className="text-2xl font-black text-rose-600">
                    {totals.totalCosts.toFixed(2)} ₴
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Продано / Куплено
                  </span>
                  <span className="text-2xl font-black text-blue-600">
                    {totals.totalSells}{" "}
                    <span className="text-slate-300">/</span>{" "}
                    {totals.totalPurchased}
                  </span>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col">
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
                    Остаток на складе
                  </span>
                  <span className="text-2xl font-black text-orange-600">
                    {remainingStock} шт
                  </span>
                </div>
              </div>

              {/* ROI & Projections */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-6 rounded-2xl border border-green-200 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-200/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                  <span className="text-green-700 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">
                    Прогноз прибыли
                  </span>
                  <span className="text-3xl font-black text-green-700 mb-1 relative z-10">
                    +{potentialProfit.toFixed(2)} ₴
                  </span>
                  <div className="flex items-center gap-2 mt-auto pt-2 relative z-10">
                    <span className="bg-green-200 text-green-800 text-xs font-black px-2 py-1 rounded-md">
                      ROI {roi.toFixed(1)}%
                    </span>
                    <span className="text-green-700/80 text-xs font-medium">
                      Если продать все
                    </span>
                  </div>
                </div>

                <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-200 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                  <span className="text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2 relative z-10">
                    Текущая Маржа
                  </span>
                  <span className="text-3xl font-black text-indigo-700 mb-1 relative z-10">
                    {margin > 0 ? "+" : ""}
                    {margin.toFixed(2)} ₴
                  </span>
                  <div className="flex items-center gap-2 mt-auto pt-2 relative z-10">
                    <span className="bg-indigo-200 text-indigo-800 text-xs font-black px-2 py-1 rounded-md">
                      ROI {currentRoi.toFixed(1)}%
                    </span>
                    <span className="text-indigo-700/80 text-xs font-medium">
                      Уже продано
                    </span>
                  </div>
                </div>
              </div>

              {/* Variants Summary */}
              {variants.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 mt-1 overflow-hidden flex flex-col relative z-10">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/80">
                    <h3 className="text-slate-800 font-black uppercase tracking-wider text-xs flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Версии товара ({variants.length})
                    </h3>
                  </div>
                  <div className="flex-1 p-4 grid grid-cols-1 gap-2">
                    {variants.map((v: any, i: number) => {
                      if (v.isIncluded === false) return null;
                      const priceCNY = Number(v.priceCNY) || 0;
                      const priceInUA = Number(v.priceInUA) || 0;
                      const purchased = Number(v.purchasedCount) || 0;
                      const sells = Number(v.sellsCount) || 0;

                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 last:pb-0"
                        >
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold text-sm">
                              Версия {i + 1}
                            </span>
                            <span className="text-slate-500 text-xs truncate max-w-[150px]">
                              {v.pddSearchQuery || "Без названия"}
                            </span>
                          </div>
                          <div className="flex items-center gap-5 text-sm">
                            <div className="flex flex-col items-end">
                              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                Закупка
                              </span>
                              <span className="text-slate-800 font-black">
                                {priceCNY} ¥
                              </span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                Продажа
                              </span>
                              <span className="text-slate-800 font-black">
                                {priceInUA > 0 ? `${priceInUA} ₴` : "—"}
                              </span>
                            </div>
                            <div className="flex flex-col items-end min-w-[70px]">
                              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                Куп/Прод
                              </span>
                              <span className="text-slate-800 font-black">
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
            </div>
          </div>
        </div>
      </div>
      {exportedImageUri && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-background border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-foreground">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-lg text-foreground">
                Готовый отчет
              </h3>
              <button
                onClick={() => setExportedImageUri(null)}
                className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center gap-4 text-center">
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold px-4 py-3 rounded-xl w-full flex flex-col gap-1 items-center justify-center">
                <span>📱 Сохранение на iPhone:</span>
                <span className="font-normal text-muted-foreground mt-0.5">
                  Зажмите пальцем картинку и выберите{" "}
                  <strong>«Сохранить в Фото»</strong>, либо нажмите кнопку{" "}
                  <strong>«Поделиться»</strong> ниже и выберите{" "}
                  <strong>«Сохранить изображение»</strong>.
                </span>
              </div>

              <div className="relative border rounded-xl overflow-hidden shadow-md max-w-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center min-h-[200px]">
                <img
                  src={exportedImageUri}
                  alt="Статистика товара"
                  className="max-w-full max-h-[50vh] object-contain"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex flex-col sm:flex-row gap-2">
              {shareSupported ? (
                <button
                  onClick={handleShare}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-semibold text-sm active:scale-98"
                >
                  <Share2 className="w-4 h-4" />
                  Поделиться / Сохранить
                </button>
              ) : (
                <a
                  href={exportedImageUri}
                  download={`statistics-${data?.name || "product"}.png`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md transition-all font-semibold text-sm active:scale-98 text-center"
                >
                  Скачать файл
                </a>
              )}
              <button
                onClick={() => setExportedImageUri(null)}
                className="px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl transition-all font-semibold text-sm"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
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
