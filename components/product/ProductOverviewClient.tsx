"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Package,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  BarChart3,
  Copy,
  Check,
  ExternalLink,
  ShoppingBag,
  Truck,
  Scale,
  Wallet,
  Tag,
  Layers,
  ChevronRight,
  CircleDollarSign,
  Percent,
  BoxSelect,
} from "lucide-react";

type ProductOverviewClientProps = {
  id: string;
  product: any;
  rates: { cny?: number; usd?: number };
};

export function ProductOverviewClient({
  id,
  product,
  rates,
}: ProductOverviewClientProps) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const images: string[] = Array.isArray(product?.images)
    ? product.images
        .map((img: any) => (typeof img === "string" ? img : (img?.url ?? "")))
        .filter(Boolean)
    : [];

  const variants: any[] = Array.isArray(product?.variants)
    ? product.variants
    : [];

  const handleCopy = (text: string, field: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  // ─── Totals ──────────────────────────────────────────────────────────────────
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

  const sellRatio =
    totals.totalPurchased > 0
      ? (totals.totalSells / totals.totalPurchased) * 100
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Navigation Bar ─────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => router.push(`/product/${id}`)}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-border hover:bg-muted transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold truncate text-foreground">
              {product?.name || "Обзор товара"}
            </h1>
            {product?.folder && (
              <p className="text-xs text-muted-foreground truncate">
                {product.folder.name}
              </p>
            )}
          </div>
          {product?.pinduoduoUrl && (
            <a
              href={product.pinduoduoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-border hover:bg-muted transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              PDD
            </a>
          )}
          <Link
            href={`/product/${id}`}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
          >
            Редактировать
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ─── Hero: Images + Title + Key Numbers ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Image Gallery */}
          {images.length > 0 && (
            <div className="lg:col-span-2 flex flex-col gap-3">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-muted/20">
                {/* Ambient glow background */}
                <div className="absolute inset-0 z-0">
                  <Image
                    src={images[activeImage]}
                    alt=""
                    fill
                    className="object-cover blur-3xl scale-110 opacity-30"
                    sizes="400px"
                  />
                </div>
                <Image
                  src={images[activeImage]}
                  alt={product?.name || "Product"}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-contain relative z-10"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-3 right-3 z-20 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    {activeImage + 1} / {images.length}
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={`relative h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        i === activeImage
                          ? "border-primary shadow-lg shadow-primary/30 scale-105"
                          : "border-border/50 opacity-60 hover:opacity-100 hover:border-border"
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${i + 1}`}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Title + Primary Stats */}
          <div
            className={`${images.length > 0 ? "lg:col-span-3" : "lg:col-span-5"} flex flex-col gap-4`}
          >
            <div>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight text-foreground">
                {product?.name || "Без названия"}
              </h2>
              {product?.folder && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <Package className="h-3 w-3" />
                  {product.folder.name}
                </span>
              )}
            </div>

            {/* 4 headline stats */}
            <div className="grid grid-cols-2 gap-3">
              <StatPill
                icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
                label="Доход (факт.)"
                value={`${totals.totalIncome.toFixed(0)} ₴`}
                color="emerald"
              />
              <StatPill
                icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
                label="Расходы"
                value={`${totals.totalCosts.toFixed(0)} ₴`}
                color="rose"
              />
              <StatPill
                icon={<ShoppingCart className="h-4 w-4 text-blue-500" />}
                label="Продано / Куплено"
                value={`${totals.totalSells} / ${totals.totalPurchased}`}
                color="blue"
              />
              <StatPill
                icon={<Package className="h-4 w-4 text-amber-500" />}
                label="Остаток"
                value={`${remainingStock} шт`}
                color="amber"
              />
            </div>

            {/* Sell-through progress bar */}
            {totals.totalPurchased > 0 && (
              <div className="rounded-2xl border border-border/50 bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Продано
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {sellRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-linear-to-r from-indigo-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${Math.min(sellRatio, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5 text-xs text-muted-foreground font-medium">
                  <span>{totals.totalSells} продано</span>
                  <span>{remainingStock} осталось</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Profit Cards ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Potential profit */}
          <div
            className={`relative overflow-hidden rounded-2xl p-6 border-2 ${potentialProfit >= 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"}`}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 bg-emerald-400 pointer-events-none" />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Прогноз прибыли
                </p>
                <p className="text-xs text-muted-foreground">
                  При продаже всех {totals.totalPurchased} шт
                </p>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-lg ${roi >= 0 ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"}`}
              >
                ROI {roi.toFixed(1)}%
              </span>
            </div>
            <p
              className={`text-4xl font-black relative z-10 ${potentialProfit >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
            >
              {potentialProfit >= 0 ? "+" : ""}
              {potentialProfit.toFixed(2)} ₴
            </p>
          </div>

          {/* Current margin */}
          <div
            className={`relative overflow-hidden rounded-2xl p-6 border-2 ${margin >= 0 ? "border-indigo-500/30 bg-indigo-500/5" : "border-orange-500/30 bg-orange-500/5"}`}
          >
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 bg-indigo-400 pointer-events-none" />
            <div className="flex items-start justify-between mb-3 relative z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                  Текущая маржа
                </p>
                <p className="text-xs text-muted-foreground">
                  {totals.totalSells} из {totals.totalPurchased} продано
                </p>
              </div>
              <span
                className={`text-xs font-black px-2.5 py-1 rounded-lg ${currentRoi >= 0 ? "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400" : "bg-orange-500/20 text-orange-600 dark:text-orange-400"}`}
              >
                ROI {currentRoi.toFixed(1)}%
              </span>
            </div>
            <p
              className={`text-4xl font-black relative z-10 ${margin >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-orange-600 dark:text-orange-400"}`}
            >
              {margin >= 0 ? "+" : ""}
              {margin.toFixed(2)} ₴
            </p>
          </div>
        </div>

        {/* ─── Cost Breakdown ──────────────────────────────────────────────────── */}
        <Section
          title="Структура расходов"
          icon={<Wallet className="h-4 w-4" />}
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <DetailCard
              label="Товары (закупка)"
              value={`${totals.totalGoodsCostUAH.toFixed(2)} ₴`}
              icon={<Tag className="h-4 w-4 text-violet-500" />}
            />
            <DetailCard
              label="Доставка"
              value={`${totals.totalShippingUAH.toFixed(2)} ₴`}
              sub={
                totalShippingUSD > 0
                  ? `≈ $${totalShippingUSD.toFixed(2)}`
                  : undefined
              }
              icon={<Truck className="h-4 w-4 text-sky-500" />}
            />
            {totals.totalWeight > 0 && (
              <DetailCard
                label="Общий вес"
                value={
                  totals.totalWeight >= 1000
                    ? `${(totals.totalWeight / 1000).toFixed(2)} кг`
                    : `${totals.totalWeight} г`
                }
                icon={<Scale className="h-4 w-4 text-teal-500" />}
              />
            )}
            <DetailCard
              label="Потенц. выручка"
              value={`${totals.totalPotentialRevenue.toFixed(2)} ₴`}
              icon={<CircleDollarSign className="h-4 w-4 text-emerald-500" />}
            />
            <DetailCard
              label="Текущий доход"
              value={`${totals.totalIncome.toFixed(2)} ₴`}
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
            />
            <DetailCard
              label="Итого расходов"
              value={`${totals.totalCosts.toFixed(2)} ₴`}
              icon={<TrendingDown className="h-4 w-4 text-rose-500" />}
            />
          </div>
        </Section>

        {/* ─── Variants ────────────────────────────────────────────────────────── */}
        {variants.length > 0 && (
          <Section
            title={`Версии товара (${variants.length})`}
            icon={<Layers className="h-4 w-4" />}
          >
            <div className="space-y-3">
              {variants.map((v, i) => {
                const rateCNY = v.rateCNY || rates?.cny || 0;
                const priceCNY = Number(v.priceCNY) || 0;
                const priceInUA = Number(v.priceInUA) || 0;
                const purchased = Number(v.purchasedCount) || 0;
                const sells = Number(v.sellsCount) || 0;
                const shippingUA = Number(v.shippingUA) || 0;
                const managementUAH = Number(v.managementUAH) || 0;
                const unitWeight = Number(v.weight) || 0;
                const purchaseUAH = priceCNY * (rateCNY > 0 ? rateCNY : 1);
                const unitShippingUAH =
                  purchased > 0
                    ? shippingUA / purchased
                    : unitWeight > 0 && (v.rateUSD || rates?.usd || 0) > 0
                      ? (unitWeight / 1000) *
                        (v.shippingType === "sea"
                          ? 7.1
                          : v.shippingType === "custom"
                            ? v.customShippingRate || 0
                            : 18.3) *
                        (v.rateUSD || rates?.usd || 0)
                      : 0;
                const unitManagementUAH =
                  purchased > 0 ? managementUAH / purchased : 0;
                const unitCostPriceUAH =
                  purchaseUAH + unitShippingUAH + unitManagementUAH;
                const actualNetPrice =
                  v.netPrice || (priceInUA > 0 ? priceInUA * 0.98 - 20 : 0);
                const unitMargin = actualNetPrice - unitCostPriceUAH;
                const variantIncome = sells * actualNetPrice;
                const shippingLabel =
                  v.shippingType === "sea"
                    ? "Море 7.1$/кг"
                    : v.shippingType === "custom"
                      ? `Своя ${v.customShippingRate || 0}$/кг`
                      : "Авиа 18.3$/кг";

                return (
                  <div
                    key={i}
                    className={`rounded-2xl border overflow-hidden transition-all ${v.isIncluded === false ? "opacity-50 border-dashed border-border/40" : "border-border/60 bg-card/50 hover:border-border"}`}
                  >
                    {/* Variant header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border/40">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center h-6 w-6 rounded-lg bg-primary/10 text-primary text-xs font-black">
                          {i + 1}
                        </span>
                        <span className="font-bold text-sm text-foreground truncate max-w-[200px]">
                          {v.pddSearchQuery || `Версия ${i + 1}`}
                        </span>
                        {v.isIncluded === false && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-semibold">
                            Исключена
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {v.pddSearchQuery && (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                handleCopy(v.pddSearchQuery, `pdd-${i}`)
                              }
                              className="p-1.5 rounded-lg border border-border/50 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                              title="Скопировать запрос"
                            >
                              {copiedField === `pdd-${i}` ? (
                                <Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const encodedQuery = encodeURIComponent(
                                  v.pddSearchQuery,
                                );
                                const isMobile =
                                  typeof window !== "undefined" &&
                                  /iPhone|iPad|iPod|Android/i.test(
                                    navigator.userAgent,
                                  );
                                const appUrl = `pinduoduo://yangkeduo.com/search_result.html?search_key=${encodedQuery}`;
                                const webUrl = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodedQuery}`;
                                if (isMobile) {
                                  window.location.href = appUrl;
                                  setTimeout(() => {
                                    if (!document.hidden)
                                      window.open(webUrl, "_blank");
                                  }, 1500);
                                } else {
                                  window.open(webUrl, "_blank");
                                }
                              }}
                              className="p-1.5 rounded-lg border border-border/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-rose-500 hover:text-rose-600 transition-colors"
                              title="Открыть в Pinduoduo"
                            >
                              <ShoppingBag className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Variant body — buy + sell side by side */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
                      {/* Buy side */}
                      <div className="p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <Tag className="h-3 w-3" />
                          Закупка
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <MiniRow label="Цена" value={`${priceCNY} ¥`} />
                          <MiniRow
                            label="≈ в UAH"
                            value={`${purchaseUAH.toFixed(2)} ₴`}
                          />
                          <MiniRow label="Куплено" value={`${purchased} шт`} />
                          {unitWeight > 0 && (
                            <MiniRow
                              label="Вес (1 шт)"
                              value={
                                unitWeight >= 1000
                                  ? `${(unitWeight / 1000).toFixed(3)} кг`
                                  : `${unitWeight} г`
                              }
                            />
                          )}
                          <MiniRow
                            label="Доставка"
                            value={`${shippingUA.toFixed(2)} ₴`}
                            sub={shippingLabel}
                          />
                          <MiniRow
                            label="Доставка (1 шт)"
                            value={`${unitShippingUAH.toFixed(2)} ₴`}
                          />
                          {managementUAH > 0 && (
                            <MiniRow
                              label="Управление"
                              value={`${managementUAH.toFixed(2)} ₴`}
                            />
                          )}
                          <MiniRow
                            label="Себестоимость"
                            value={`${unitCostPriceUAH.toFixed(2)} ₴`}
                            highlight
                          />
                        </div>
                      </div>

                      {/* Sell side */}
                      <div className="p-4 space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3" />
                          Продажа
                        </p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <MiniRow
                            label="Цена продажи"
                            value={priceInUA > 0 ? `${priceInUA} ₴` : "—"}
                          />
                          <MiniRow
                            label="Чистая цена"
                            value={
                              actualNetPrice > 0
                                ? `${actualNetPrice.toFixed(2)} ₴`
                                : "—"
                            }
                          />
                          <MiniRow label="Продано" value={`${sells} шт`} />
                          <MiniRow
                            label="Остаток"
                            value={`${purchased - sells} шт`}
                          />
                          <MiniRow
                            label="Доход (факт.)"
                            value={`${variantIncome.toFixed(2)} ₴`}
                          />
                          <MiniRow
                            label="Маржа (1 шт)"
                            value={`${unitMargin.toFixed(2)} ₴`}
                            highlight
                            positive={unitMargin >= 0}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ─── Expenses ────────────────────────────────────────────────────────── */}
        {product?.expenses && product.expenses.length > 0 && (
          <Section
            title="Детальные расходы"
            icon={<BarChart3 className="h-4 w-4" />}
          >
            <div className="rounded-2xl border border-border/60 overflow-hidden">
              {product.expenses.map((exp: any, i: number) => (
                <div
                  key={exp.id || i}
                  className="flex items-center justify-between px-4 py-3 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">
                    {exp.type || "Без типа"}
                  </span>
                  <span className="text-sm font-black text-foreground">
                    {Number(exp.amount).toFixed(2)} ₴
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30 font-black text-sm">
                <span>Итого расходов</span>
                <span>
                  {product.expenses
                    .reduce(
                      (s: number, e: any) => s + (Number(e.amount) || 0),
                      0,
                    )
                    .toFixed(2)}{" "}
                  ₴
                </span>
              </div>
            </div>
          </Section>
        )}

        {/* ─── Links ───────────────────────────────────────────────────────────── */}
        {product?.pinduoduoUrl && (
          <Section title="Ссылки" icon={<ExternalLink className="h-4 w-4" />}>
            <div className="flex items-center gap-2">
              <a
                href={product.pinduoduoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm font-semibold"
              >
                <ExternalLink className="h-4 w-4" />
                Открыть на Pinduoduo
              </a>
              <button
                type="button"
                onClick={() => handleCopy(product.pinduoduoUrl, "link")}
                className="p-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                title="Скопировать ссылку"
              >
                {copiedField === "link" ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </Section>
        )}

        {/* bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  );
}

// ─── Helper Components ────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center h-7 w-7 rounded-xl bg-primary/10 text-primary">
          {icon}
        </span>
        <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </div>
  );
}

function StatPill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "rose" | "blue" | "amber";
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-500/8 border-emerald-500/20",
    rose: "bg-rose-500/8 border-rose-500/20",
    blue: "bg-blue-500/8 border-blue-500/20",
    amber: "bg-amber-500/8 border-amber-500/20",
  };
  return (
    <div
      className={`flex flex-col gap-1 p-4 rounded-2xl border ${colorMap[color]}`}
    >
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      </div>
      <p className="text-xl font-black text-foreground leading-none">{value}</p>
    </div>
  );
}

function DetailCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-2xl border border-border/50 bg-card/60">
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center h-7 w-7 rounded-xl bg-muted/50">
          {icon}
        </span>
        <p className="text-xs font-semibold text-muted-foreground leading-tight">
          {label}
        </p>
      </div>
      <p className="text-lg font-black text-foreground">{value}</p>
      {sub && (
        <p className="text-xs font-medium text-muted-foreground">{sub}</p>
      )}
    </div>
  );
}

function MiniRow({
  label,
  value,
  sub,
  highlight,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">
        {label}
      </p>
      <p
        className={`text-sm font-black leading-tight ${
          highlight
            ? positive === false
              ? "text-rose-500"
              : positive === true
                ? "text-emerald-500"
                : "text-foreground"
            : "text-foreground"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[10px] text-muted-foreground font-medium">{sub}</p>
      )}
    </div>
  );
}
