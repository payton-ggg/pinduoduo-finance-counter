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

type FormValues = {
  name: string;
  priceCNY: number;
  shippingUA?: number;
  managementUAH?: number;
  priceInUA?: number;
  netPrice?: number;
  olxUrl?: string;
  pinduoduoUrl?: string;
  chip?: string;
  weight?: number;
  sellsCount?: number;
  purchasedCount?: number;
  rateCNY?: number;
  rateUSD?: number;
  shippingType?: "air" | "sea" | "custom";
  customShippingRate?: number;
};

type BasicFieldsProps = {
  register: UseFormRegister<any>;
  errors: FieldErrors<FormValues>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
};

export function BasicFields({
  register,
  errors,
  setValue,
  watch,
}: BasicFieldsProps) {
  const weight = watch("weight");
  const purchasedCount = watch("purchasedCount");
  const rateUSD = watch("rateUSD");
  const shippingType = watch("shippingType") || "air";
  const customShippingRate = watch("customShippingRate");

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(false);
  const [hasInitAuto, setHasInitAuto] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const shippingUA = watch("shippingUA");

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
      if (data.cny) setValue("rateCNY", data.cny);
      if (data.usd) setValue("rateUSD", data.usd);
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
        case "air":
          ratePerKgUSD = 18.3;
          break;
        case "sea":
          ratePerKgUSD = 7.1;
          break;
        case "custom":
          ratePerKgUSD = customShippingRate || 0;
          break;
      }

      const shippingCostUSD = (weight / 1000) * purchasedCount * ratePerKgUSD;
      const shippingCostUAH = shippingCostUSD * rateUSD;
      setValue("shippingUA", parseFloat(shippingCostUAH.toFixed(2)), { shouldDirty: true });
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

  const priceInUA = watch("priceInUA");
  const netPrice = watch("netPrice");

  useEffect(() => {
    // Auto-calculate netPrice if priceInUA changes and netPrice is not manually set, or simply update it
    if (priceInUA && priceInUA > 0) {
      const calculatedNet = priceInUA * 0.98 - 20;
      // We will sync it automatically to save time, but allow manual edits if needed?
      // Actually, if they added netPrice as a field, let's just let it be calculated automatically unless they want to type it.
      // A better UX: auto-calculate but let them edit. Let's just calculate it directly if they change priceInUA.
      // To avoid infinite loops or overwriting manual inputs, we'll just leave it up to the form logic or calculate it here.
    }
  }, [priceInUA]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Название</label>
        <input
          className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
          {...register("name", { required: "Название обязательно" })}
          placeholder="Например: AirPods Pro Replica"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">
            {String(errors.name.message)}
          </p>
        )}
      </div>

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
            {...register("rateCNY", { valueAsNumber: true })}
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
            {...register("rateUSD", { valueAsNumber: true })}
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
            {...register("priceCNY", {
              required: "Цена обязательна",
              valueAsNumber: true,
              min: { value: 0, message: "Цена должна быть >= 0" },
            })}
            placeholder="Например: 499.99"
          />
          {errors.priceCNY && (
            <p className="text-red-600 text-sm mt-1">
              {String(errors.priceCNY.message)}
            </p>
          )}
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Цена продажи (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("priceInUA", {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
              onChange: (e) => {
                const val = parseFloat(e.target.value);
                if (val > 0) {
                  setValue("netPrice", parseFloat((val * 0.98 - 20).toFixed(2)), { shouldDirty: true });
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
            {...register("netPrice", {
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
            {...register("shippingType")}
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
              {...register("customShippingRate", {
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
              {...register("shippingUA", {
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
            {...register("managementUAH", {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
            })}
            placeholder="Например: 5.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Ссылка OLX</label>
        <div className="relative">
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 pr-12 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("olxUrl")}
            placeholder="https://www.olx.ua/…"
          />
          <button
            type="button"
            onClick={() => handleCopy(watch("olxUrl"), "olxUrl")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Скопировать"
          >
            {copiedField === "olxUrl" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
          Ссылка Pinduoduo
        </label>
        <div className="relative">
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 pr-12 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("pinduoduoUrl")}
            placeholder="https://mobile.yangkeduo.com/…"
          />
          <button
            type="button"
            onClick={() => handleCopy(watch("pinduoduoUrl"), "pinduoduoUrl")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground transition-colors"
            title="Скопировать"
          >
            {copiedField === "pinduoduoUrl" ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Вес</label>
          <input
            type="number"
            step="0.01"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("weight", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Чип</label>
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("chip")}
            placeholder="Например: H2"
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Продано (шт)</label>
          <input
            type="number"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("sellsCount", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">Куплено (шт)</label>
          <input
            type="number"
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("purchasedCount", { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );
}
