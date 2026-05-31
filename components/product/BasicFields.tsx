"use client";

import { useEffect, useState } from "react";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator, Copy, Check } from "lucide-react";

type VariantFieldsProps = {
  prefix: string;
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
};

export function VariantFields({
  prefix,
  register,
  setValue,
  watch,
}: VariantFieldsProps) {
  const weight = watch(`${prefix}.weight`);
  const purchasedCount = watch(`${prefix}.purchasedCount`);
  const rateUSD = watch(`${prefix}.rateUSD`);
  const shippingType = watch(`${prefix}.shippingType`) || "air";
  const customShippingRate = watch(`${prefix}.customShippingRate`);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [hasInitAuto, setHasInitAuto] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const shippingUA = watch(`${prefix}.shippingUA`);

  const handleCopy = (text: string, fieldName: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  useEffect(() => {
    if (hasInitAuto) return;

    if (shippingUA === undefined) {
      setAutoCalculate(true);
      setHasInitAuto(true);
      return;
    }

    if (rateUSD !== undefined && rateUSD > 0) {
      let ratePerKgUSD = 0;
      switch (shippingType) {
        case "air": ratePerKgUSD = 18.3; break;
        case "sea": ratePerKgUSD = 7.1; break;
        case "custom": ratePerKgUSD = customShippingRate || 0; break;
      }

      const calcUSD = ((weight || 0) / 1000) * (purchasedCount || 0) * ratePerKgUSD;
      const calcUAH = parseFloat((calcUSD * rateUSD).toFixed(2));

      if (shippingUA === calcUAH) {
        setAutoCalculate(true);
      } else {
        setAutoCalculate(false);
      }
      setHasInitAuto(true);
    }
  }, [hasInitAuto, shippingUA, rateUSD, weight, purchasedCount, shippingType, customShippingRate]);

  const fetchRates = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/rates");
      const data = await res.json();
      if (data.cny) setValue(`${prefix}.rateCNY`, data.cny);
      if (data.usd) setValue(`${prefix}.rateUSD`, data.usd);
    } catch (error) {
      console.error("Failed to refresh rates", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const calculateShipping = (isManual = false) => {
    if (weight && purchasedCount && rateUSD) {
      let ratePerKgUSD = 0;
      switch (shippingType) {
        case "air": ratePerKgUSD = 18.3; break;
        case "sea": ratePerKgUSD = 7.1; break;
        case "custom": ratePerKgUSD = customShippingRate || 0; break;
      }

      const shippingCostUSD = (weight / 1000) * purchasedCount * ratePerKgUSD;
      const shippingCostUAH = shippingCostUSD * rateUSD;
      setValue(`${prefix}.shippingUA`, parseFloat(shippingCostUAH.toFixed(2)), { shouldDirty: true });
    } else if (isManual) {
      alert("Для расчета укажите: Вес (г), Куплено (шт) и Курс (USD)");
    }
  };

  useEffect(() => {
    if (autoCalculate) {
      calculateShipping();
    }
  }, [
    weight,
    purchasedCount,
    rateUSD,
    shippingType,
    customShippingRate,
    autoCalculate,
    setValue,
  ]);

  const priceInUA = watch(`${prefix}.priceInUA`);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="flex text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 items-center justify-between">
            Курс (CNY - UAH) 🇨🇳
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchRates}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </label>
          <input
            type="number"
            step="0.0001"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.rateCNY`, { valueAsNumber: true })}
            placeholder="Например: 5.80"
          />
        </div>
        <div>
          <label className="flex text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2 items-center justify-between">
            Курс (USD - UAH) 🇺🇸
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={fetchRates}
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
          </label>
          <input
            type="number"
            step="0.0001"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.rateUSD`, { valueAsNumber: true })}
            placeholder="Например: 42.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Цена закупки (¥)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.priceCNY`, {
              valueAsNumber: true,
              min: { value: 0, message: "Цена должна быть >= 0" },
            })}
            placeholder="Например: 499.99"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Цена продажи (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.priceInUA`, {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                if (val > 0) {
                  setValue(`${prefix}.netPrice`, parseFloat((val * 0.98 - 20).toFixed(2)), { shouldDirty: true });
                }
              }
            })}
            placeholder="Цена за единицу"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Цена чистыми (netPrice) (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.netPrice`, {
              valueAsNumber: true,
            })}
            placeholder="После вычета комиссии"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Тип доставки</label>
          <select
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.shippingType`)}
          >
            <option value="air">Авиа (18.3$ / кг)</option>
            <option value="sea">Море (7.1$ / кг)</option>
            <option value="custom">Своя цена / кг</option>
          </select>
        </div>

        {shippingType === "custom" && (
          <div>
            <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
              Своя цена ($)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              {...register(`${prefix}.customShippingRate`, {
                valueAsNumber: true,
                min: { value: 0, message: ">= 0" },
              })}
              placeholder="Например: 10.5"
            />
          </div>
        )}

        <div
          className={
            shippingType !== "custom" ? "sm:col-span-1 lg:col-span-2" : ""
          }
        >
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Цена доставки (₴)
            </label>
            <label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="rounded border-gray-300"
              />
              Авторасчет
            </label>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              className="flex-1 bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
              {...register(`${prefix}.shippingUA`, {
                valueAsNumber: true,
                min: { value: 0, message: "Должна быть >= 0" },
                onChange: () => {
                  setAutoCalculate(false);
                }
              })}
              placeholder="Например: 10.00"
            />
            <Button
              type="button"
              onClick={() => calculateShipping(true)}
              className="px-4 sm:px-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center gap-2 shrink-0 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5"
              title="Рассчитать стоимость доставки"
            >
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">Рассчитать</span>
            </Button>
          </div>
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Расходы на управление (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.managementUAH`, {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
            })}
            placeholder="Например: 5.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Поисковый запрос PDD</label>
        <div className="relative">
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 pr-12 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.pddSearchQuery`)}
            placeholder="Например: 蓝牙耳机 降噪"
          />
          <button
            type="button"
            onClick={() => handleCopy(watch(`${prefix}.pddSearchQuery`), "pddSearchQuery")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Скопировать"
          >
            {copiedField === "pddSearchQuery" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Вес (г)</label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.weight`, { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Продано (шт)</label>
          <input
            type="number"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.sellsCount`, { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Куплено (шт)</label>
          <input
            type="number"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register(`${prefix}.purchasedCount`, { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );
}
