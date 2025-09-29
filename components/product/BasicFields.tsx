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
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("name", { required: "Name is required" })}
          placeholder="AirPods Pro Replica"
        />
        {errors.name && (
          <p className="text-red-600 text-sm mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Price (UAH)</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priceUAH", {
              required: "Price is required",
              valueAsNumber: true,
              min: { value: 0, message: "Price must be >= 0" },
            })}
            placeholder="499.99"
          />
          {errors.priceUAH && (
            <p className="text-red-600 text-sm mt-1">{String(errors.priceUAH.message)}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Price in UA</label>
          <input
            type="number"
            step="0.01"
            className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("priceInUA", { valueAsNumber: true, min: { value: 0, message: "Must be >= 0" } })}
            placeholder="Optional"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">OLX URL</label>
        <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("olxUrl")} placeholder="https://www.olx.ua/…" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Pinduoduo URL</label>
        <input
          className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register("pinduoduoUrl")}
          placeholder="https://mobile.yangkeduo.com/…"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Chip</label>
          <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("chip")} placeholder="e.g. H2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Equipment</label>
          <input className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("equipment")} placeholder="e.g. Case, Cable" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Weight</label>
          <input type="number" step="0.01" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("weight", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mic Quality</label>
          <input type="number" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("microphoneQuality", { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Sells Count</label>
          <input type="number" className="w-full border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" {...register("sellsCount", { valueAsNumber: true })} />
        </div>
      </div>
    </div>
  );
}