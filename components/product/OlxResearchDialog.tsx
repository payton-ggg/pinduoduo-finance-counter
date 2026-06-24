"use client";

import { useState, useEffect } from "react";
import {
  X,
  Loader2,
  ArrowUpRight,
  Check,
  AlertCircle,
  TrendingUp,
  BarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Ad {
  id: number;
  title: string;
  price: number;
  priceLabel: string;
  url: string;
  location: string;
  photo: string | null;
  itemCondition: string;
}

interface Stats {
  min: number;
  max: number;
  avg: number;
  count: number;
}

interface OlxResearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  variants: Array<{ id: string; priceCNY: number; priceInUA?: number }>;
  onSuccess: () => void;
}

export function OlxResearchDialog({
  isOpen,
  onClose,
  productId,
  productName,
  variants,
  onSuccess,
}: OlxResearchDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    variants[0]?.id || "",
  );
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products/${productId}/olx`);
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
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Не удалось загрузить данные с OLX.ua");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isOpen, productId]);

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
              priceInUA: stats.avg,
            },
          ],
        }),
      });

      if (!res.ok) {
        throw new Error("Не удалось обновить цену товара");
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-background border border-foreground/10 shadow-2xl rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col transition-all transform scale-100 max-h-[85vh] md:max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-foreground/10 bg-linear-to-r from-primary/5 to-secondary/5">
          <div className="space-y-1">
            <h2 className="text-xl font-black flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Исследование цен на OLX.ua
            </h2>
            <p className="text-xs text-muted-foreground font-semibold truncate max-w-[450px]">
              Запрос:{" "}
              <span className="text-foreground font-bold">{productName}</span>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <p className="text-sm font-semibold text-muted-foreground animate-pulse">
                Сбор цен и анализ объявлений на OLX.ua...
              </p>
            </div>
          )}

          {error && (
            <div className="p-5 border border-destructive/20 rounded-xl bg-destructive/5 space-y-3">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-bold text-sm">
                  Ошибка получения данных
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {error}
              </p>
              <div className="text-[11px] text-muted-foreground/60 border-t border-destructive/10 pt-2">
                Подсказка: если запросы блокируются, попробуйте изменить
                название товара в вашей системе на более короткое или простое
                (без лишних технических спецификаций).
              </div>
            </div>
          )}

          {!loading && !error && stats && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black text-primary/70 tracking-wider">
                    Средняя цена
                  </span>
                  <span className="text-lg md:text-xl font-black text-foreground mt-1">
                    {stats.avg.toLocaleString()} ₴
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-2 font-medium">
                    Базовый ориентир
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black text-green-500/80 tracking-wider">
                    Минимум
                  </span>
                  <span className="text-lg md:text-xl font-black text-foreground mt-1">
                    {stats.min.toLocaleString()} ₴
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-2 font-medium">
                    Нижняя граница
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between">
                  <span className="text-[10px] uppercase font-black text-amber-500/80 tracking-wider">
                    Максимум
                  </span>
                  <span className="text-lg md:text-xl font-black text-foreground mt-1">
                    {stats.max.toLocaleString()} ₴
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-2 font-medium">
                    Верхняя граница ({stats.count} объв.)
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
                    className="w-full bg-background border border-foreground/10 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary"
                    value={selectedVariantId}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                  >
                    {variants.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        Вариант #{i + 1} (Покупка: {v.priceCNY}¥, Текущая
                        продажа: {v.priceInUA ? `${v.priceInUA}₴` : "Не задана"}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Ads list */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-widest font-black text-muted-foreground flex items-center gap-1.5">
                  <BarChart2 className="w-3.5 h-3.5" />
                  Найденные предложения на OLX ({ads.length})
                </h3>

                <div className="space-y-2 divide-y divide-foreground/5 max-h-[30vh] overflow-y-auto pr-1">
                  {ads.map((ad) => (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between py-3 gap-3 first:pt-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted shrink-0 border border-foreground/5">
                          {ad.photo ? (
                            <Image
                              src={ad.photo}
                              alt={ad.title}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs md:text-sm font-black text-foreground truncate hover:text-primary transition-colors">
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
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold mt-1">
                            <span className="bg-foreground/5 px-1.5 py-0.5 rounded-sm">
                              {ad.itemCondition}
                            </span>
                            <span>{ad.location}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs md:text-sm font-black text-foreground">
                          {ad.priceLabel}
                        </span>
                      </div>
                    </div>
                  ))}

                  {ads.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted-foreground font-semibold">
                      По данному запросу объявлений с ценами не найдено.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && !error && stats && (
          <div className="p-5 border-t border-foreground/10 flex items-center justify-between bg-muted/20">
            <span className="text-[10px] font-bold text-muted-foreground max-w-[250px] leading-tight">
              Применение установит розничную цену {stats.avg.toLocaleString()} ₴
              для выбранной вариации товара.
            </span>
            <div className="flex items-center gap-3">
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
                    : "from-primary to-secondary hover:opacity-90"
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
                    Успешно применено!
                  </>
                ) : (
                  "Применить среднюю цену"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
