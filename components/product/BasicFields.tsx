"use client";

import { useEffect, useState } from "react";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import { RefreshCw, Calculator } from "lucide-react";

type FormValues = {
  name: string;
  priceCNY: number;
  shippingUA?: number;
  managementUAH?: number;
  priceInUA?: number;
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

  const calculateShipping = () => {
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
      setValue("shippingUA", parseFloat(shippingCostUAH.toFixed(2)));
    }
  };

  useEffect(() => {
    // We only calculate shipping if we have rateUSD, weight, and count
    calculateShipping();
  }, [
    weight,
    purchasedCount,
    rateUSD,
    shippingType,
    customShippingRate,
    setValue,
  ]);
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Название</label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium mb-1 items-center justify-between">
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
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("rateCNY", { valueAsNumber: true })}
            placeholder="Например: 5.80"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 items-center justify-between">
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
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("rateUSD", { valueAsNumber: true })}
            placeholder="Например: 42.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Цена закупки (¥)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium mb-1">
            Цена продажи (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priceInUA", {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
            })}
            placeholder="Цена за единицу"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Тип доставки</label>
          <select
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-background"
            {...register("shippingType")}
          >
            <option value="air">Авиа (18.3$ / кг)</option>
            <option value="sea">Море (7.1$ / кг)</option>
            <option value="custom">Своя цена / кг</option>
          </select>
        </div>

        {shippingType === "custom" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Своя цена ($)
            </label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
          <label className="block text-sm font-medium mb-1 items-center justify-between">
            Цена доставки (₴) - Авто/Руч.
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={calculateShipping}
            >
              <Calculator className="h-3 w-3" />
            </Button>
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("shippingUA", {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
            })}
            placeholder="Например: 10.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Расходы на управление (₴)
          </label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("managementUAH", {
              valueAsNumber: true,
              min: { value: 0, message: "Должна быть >= 0" },
            })}
            placeholder="Например: 5.00"
          />
        </div>
      </div>

      <div></div>

      <div>
        <label className="block text-sm font-medium mb-1">Ссылка OLX</label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("olxUrl")}
          placeholder="https://www.olx.ua/…"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Ссылка Pinduoduo
        </label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("pinduoduoUrl")}
          placeholder="https://mobile.yangkeduo.com/…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Вес</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("weight", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Чип</label>
          <input
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("chip")}
            placeholder="Например: H2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Продано (шт)</label>
          <input
            type="number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("sellsCount", { valueAsNumber: true })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Куплено (шт)</label>
          <input
            type="number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("purchasedCount", { valueAsNumber: true })}
          />
        </div>
      </div>
    </div>
  );
}
