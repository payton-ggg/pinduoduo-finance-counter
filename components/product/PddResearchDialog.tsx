"use client";

import { useState, useEffect } from "react";
import { X, Loader2, ArrowUpRight, Check, AlertCircle, ShoppingBag, Coins, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Ad {
  id: string;
  title: string;
  price: number;
  priceLabel: string;
  url: string;
  photo: string | null;
  salesLabel: string | null;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface PddResearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variants: Array<{ id: string; priceCNY: number; priceInUA?: number; rateCNY?: number; pddSearchQuery?: string | null }>;
  rates?: { cny?: number; usd?: number };
  onSuccess: () => void;
}

export function PddResearchDialog({
  isOpen,
  onClose,
  productId,
  productName,
  variants,
  rates,
  onSuccess,
}: PddResearchDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || ""
  );
  const [actualQuery, setActualQuery] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // Find rate for conversion
  const activeVariant = variants.find(v => v.id === selectedVariantId) || variants[0];
  const conversionRate = activeVariant?.rateCNY || rates?.cny || 5.8; // Fallback to 5.8 if completely missing

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productId}/pdd?variantId=${selectedVariantId}`);
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }
        setStats(data.stats);
        setAds(data.ads || []);
        setActualQuery(data.query || null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Не удалось загрузить данные с Pinduoduo");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, productId, selectedVariantId]);

  const handleApplyPrice = async () => {
    if (!stats || !selectedVariantId) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variants: [
            {
              id: selectedVariantId,
              priceCNY: stats.avg,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error("Не удалось обновить цену закупки");
      }

      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Ошибка при обновлении цены");
    } finally {
      setUpdating(false);
    }
  };

  const convertToUah = (cny: number) => {
    return Math.round(cny * conversionRate);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-background border border-foreground/10 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col transition-all transform scale-100 max-h-[92vh] sm:max-h-[85vh] md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-foreground/10 bg-linear-to-r from-red-500/5 to-orange-500/5">
          <div className="space-y-1">
            <h2 className="text-xl font-black flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-red-500" />
              Анализ цен Pinduoduo
            </h2>
            <p className="text-xs text-muted-foreground font-semibold truncate max-w-[450px]">
              Запрос: <span className="text-foreground font-bold">{actualQuery || productName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-red-500" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Подключение Puppeteer и поиск на Pinduoduo...
              </p>
            </div>
          )}

          {error && (
            <div className="p-5 border border-red-500/20 rounded-xl bg-red-500/5 space-y-3">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">Требуется авторизация или обновление</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {error}
              </p>
              <div className="text-[11px] text-muted-foreground/60 border-t border-red-500/10 pt-2">
                Инструкция: откройте в браузере мобильную версию <a href="https://mobile.yangkeduo.com" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:underline">mobile.yangkeduo.com</a>, пройдите SMS-вход, откройте вкладку Network в DevTools, найдите любой запрос, скопируйте заголовок `cookie` и обновите `PDD_COOKIE` в файле `.env`.
              </div>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 sm:p-4 rounded-xl bg-red-500/5 border border-red-500/10 flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black text-red-500/80 tracking-wider">
                    Средняя
                  </span>
                  <span className="text-base sm:text-lg md:text-xl font-black text-foreground mt-0.5 sm:mt-1">
                    {stats.avg.toLocaleString()} ¥
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                    ≈ {convertToUah(stats.avg)} ₴
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black text-green-500/80 tracking-wider">
                    Минимум
                  </span>
                  <span className="text-base sm:text-lg md:text-xl font-black text-foreground mt-0.5 sm:mt-1">
                    {stats.min.toLocaleString()} ¥
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                    ≈ {convertToUah(stats.min)} ₴
                  </span>
                </div>

                <div className="p-3 sm:p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between">
                  <span className="text-[9px] sm:text-[10px] uppercase font-black text-amber-500/80 tracking-wider">
                    Максимум
                  </span>
                  <span className="text-base sm:text-lg md:text-xl font-black text-foreground mt-0.5 sm:mt-1">
                    {stats.max.toLocaleString()} ¥
                  </span>
                  <span className="text-[9px] text-muted-foreground font-semibold mt-1">
                    ≈ {convertToUah(stats.max)} ₴
                  </span>
                </div>
              </div>

              {/* Variant Selector */}
              {variants.length > 1 && (
                <div className="p-4 border border-foreground/5 rounded-xl bg-foreground/3 space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">
                    Выберите вариацию для применения цены
                  </label>
                  <select
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-red-500/40 focus:outline-none focus:border-red-500"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    {variants.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        Вариант #{i + 1} {v.pddSearchQuery ? `("${v.pddSearchQuery}")` : ""} (Закупка: {v.priceCNY}¥, Курс: {v.rateCNY || rates?.cny || "глоб."} грн/¥)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ads list */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5" />
                  Предложения на Pinduoduo ({ads.length})
                </h3>

                <div className="space-y-2 divide-y divide-foreground/5 max-h-[45vh] sm:max-h-[30vh] overflow-y-auto pr-1">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between py-3 gap-3 first:pt-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-foreground/5">
                          {ad.photo ? (
                            <Image
                              src={ad.photo}
                              alt={ad.title}
                              fill
                              sizes="80px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-black text-foreground truncate hover:text-red-500 transition-colors">
                            <a
                              href={ad.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1"
                            >
                              {ad.title}
                              <ArrowUpRight className="w-3.5 h-3.5 opacity-40 shrink-0" />
                            </a>
                          </h4>
                          {ad.salesLabel && (
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-1">
                              <span className="bg-red-500/5 text-red-500 px-1.5 py-0.5 rounded-sm">
                                {ad.salesLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className="text-xs md:text-sm font-black text-foreground">
                          {ad.priceLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold mt-0.5">
                          ≈ {convertToUah(ad.price)} ₴
                        </span>
                      </div>
                    </div>
                  ))}

                  {ads.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground font-semibold">
                      По данному запросу товаров не найдено.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && stats && (
          <div className="p-4 sm:p-5 border-t border-foreground/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground sm:max-w-[250px] leading-tight">
              Применение установит базовую цену закупки {stats.avg.toFixed(1)} ¥ ({convertToUah(stats.avg)} ₴) для выбранной вариации.
            </span>
            <div className="flex items-center justify-end gap-2 sm:gap-3">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={updating}
                className="font-semibold"
              >
                Закрыть
              </Button>
              <Button
                onClick={handleApplyPrice}
                disabled={updating || updateSuccess || ads.length === 0}
                className={`font-semibold text-white px-5 bg-linear-to-r ${
                  updateSuccess
                    ? "from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                    : "from-red-500 to-orange-500 hover:opacity-90"
                } transition-all duration-300`}
              >
                {updating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Сохранение...
                  </>
                ) : updateSuccess ? (
                  <>
                    <Check className="w-4 h-4 mr-1.5" />
                    Успешно применили!
                  </>
                ) : (
                  "Применить цену CNY"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
