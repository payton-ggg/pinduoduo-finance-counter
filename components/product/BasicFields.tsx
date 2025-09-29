"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";

type FormValues = {
  name: string;
  priceUAH: number;
  priceInUA?: number;
  olxUrl?: string;
  pinduoduoUrl?: string;
  chip?: string;
  equipment?: string;
  weight?: number;
  microphoneQuality?: number;
  sellsCount?: number;
};

type BasicFieldsProps = {
  register: UseFormRegister<any>;
  errors: FieldErrors<FormValues>;
};

export function BasicFields({ register, errors }: BasicFieldsProps) {
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
          <p className="text-red-600 text-sm mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Цена (¥)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priceUAH", {
              required: "Цена обязательна",
              valueAsNumber: true,
              min: { value: 0, message: "Цена должна быть >= 0" },
            })}
            placeholder="Например: 499.99"
          />
          {errors.priceUAH && (
            <p className="text-red-600 text-sm mt-1">{String(errors.priceUAH.message)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Цена в гривне (₴)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priceInUA", { valueAsNumber: true, min: { value: 0, message: "Должна быть >= 0" } })}
            placeholder="Заполняется автоматически по курсу"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ссылка OLX</label>
        <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("olxUrl")} placeholder="https://www.olx.ua/…" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ссылка Pinduoduo</label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("pinduoduoUrl")}
          placeholder="https://mobile.yangkeduo.com/…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Чип</label>
          <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("chip")} placeholder="Например: H2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Комплектация</label>
          <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("equipment")} placeholder="Например: Чехол, Кабель" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Вес</label>
          <input type="number" step="0.01" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("weight", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Качество микрофона</label>
          <input type="number" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("microphoneQuality", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Количество продаж</label>
          <input type="number" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("sellsCount", { valueAsNumber: true })} />
        </div>
      </div>
    </div>
  );
}