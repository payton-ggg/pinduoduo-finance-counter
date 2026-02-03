"use client";

import { useEffect } from "react";
import {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

type FormValues = {
  name: string;
  priceCNY: number;
  shippingUA?: number;
  managementUAH?: number;
  priceInUA?: number;
  olxUrl?: string;
  pinduoduoUrl?: string;
  chip?: string;
  equipment?: string;
  weight?: number;
  microphoneQuality?: number;
  sellsCount?: number;
  purchasedCount?: number;
  exchangeRate?: number; // Added for calculation
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
  const exchangeRate = watch("exchangeRate");

  useEffect(() => {
    if (weight && purchasedCount && exchangeRate) {
      // 18 USD per kg
      const shippingCostUSD = (weight / 1000) * purchasedCount * 18;
      const shippingCostUAH = shippingCostUSD * exchangeRate;
      setValue("shippingUA", parseFloat(shippingCostUAH.toFixed(2)));
    }
  }, [weight, purchasedCount, exchangeRate, setValue]);
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

      <div>
        <label className="block text-sm font-medium mb-1">
          Курс (USD - UAH)
        </label>
        <input
          type="number"
          step="0.01"
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("exchangeRate", { valueAsNumber: true })}
          defaultValue={42}
          placeholder="42.00"
        />
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Цена доставки (₴)
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Чип</label>
          <input
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("chip")}
            placeholder="Например: H2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Комплектация</label>
          <input
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("equipment")}
            placeholder="Например: Чехол, Кабель"
          />
        </div>
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
          <label className="block text-sm font-medium mb-1">
            Качество микрофона
          </label>
          <input
            type="number"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("microphoneQuality", { valueAsNumber: true })}
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
