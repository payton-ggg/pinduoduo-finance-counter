"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BasicFields } from "./BasicFields";
import { ImagesFieldArray } from "./ImagesFieldArray";

type FormValues = {
  name: string;
  images: { url: string }[];
  olxUrl?: string;
  pinduoduoUrl?: string;
  priceCNY?: number;
  shippingUA?: number;
  managementUAH?: number;
  weight?: number;
  sellsCount?: number;
  purchasedCount?: number;
  chip?: string;
  priceInUA?: number;
  incomes: { id?: string; amount: number }[];
  expenses: { id?: string; amount: number; type: string }[];
  exchangeRate?: number;
};

type ProductFormProps = {
  id?: string;
  initialData?: any;
};

export default function ProductForm({ id, initialData }: ProductFormProps) {
  const router = useRouter();
  const [rate, setRate] = useState<number>(0);

  const normalizedImages: { url: string }[] = Array.isArray(initialData?.images)
    ? initialData.images.map((img: any) =>
        typeof img === "string" ? { url: img } : { url: img?.url ?? "" }
      )
    : [{ url: "" }];

  const defaultValues: FormValues = {
    name: initialData?.name ?? "",
    images: normalizedImages,
    olxUrl: initialData?.olxUrl ?? "",
    pinduoduoUrl: initialData?.pinduoduoUrl ?? "",
    priceCNY: initialData?.priceCNY ?? initialData?.priceUAH ?? undefined,
    shippingUA: initialData?.shippingUA ?? undefined,
    managementUAH: initialData?.managementUAH ?? undefined,
    weight: initialData?.weight ?? undefined,
    sellsCount: initialData?.sellsCount ?? undefined,
    purchasedCount: initialData?.purchasedCount ?? undefined,
    chip: initialData?.chip ?? "",
    priceInUA: initialData?.priceInUA ?? undefined,
    incomes: (initialData?.incomes || []).map((i: any) => ({
      id: i.id,
      amount: i.amount,
    })),
    expenses: (initialData?.expenses || []).map((e: any) => ({
      id: e.id,
      amount: e.amount,
      type: e.type,
    })),
    exchangeRate: 42,
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({ defaultValues });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({ control, name: "expenses" });

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json"
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setRate(Number(data[0].rate) || 0);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };
    fetchRate();
  }, []);

  const sells = watch("sellsCount");
  const purchased = watch("purchasedCount");
  const priceCNY = watch("priceCNY");
  const priceInUA = watch("priceInUA");
  const shippingUA = watch("shippingUA");
  const managementUAH = watch("managementUAH");

  const purchaseUnitCostUAH = (Number(priceCNY) || 0) * (rate > 0 ? rate : 1);
  const sellingPriceUAH = Number(priceInUA) || 0;

  // Total cost of purchasing the goods (without shipping/management)
  const totalGoodsCost = (Number(purchased) || 0) * purchaseUnitCostUAH;

  const computedIncome = (Number(sells) || 0) * sellingPriceUAH;

  // Total expenses = Goods Cost + Shipping + Management
  const computedExpense =
    totalGoodsCost + (Number(shippingUA) || 0) + (Number(managementUAH) || 0);

  // Potential (Projected) Profit Calculation
  // Revenue if all purchased items are sold
  const potentialTotalRevenue = (Number(purchased) || 0) * sellingPriceUAH;
  // Profit = Total Potential Revenue - Total Expenses
  const potentialProfit = potentialTotalRevenue - computedExpense;

  // Auto-sync calculated income/expense to form arrays if in Edit mode or if user wants these to be auto-generated
  // For now, we replicate the EditForm logic which forces these into the form state
  useEffect(() => {
    // Only auto-update if we have valid numbers
    if (computedIncome > 0) {
      const currentIncomes = watch("incomes") || [];
      setValue(
        "incomes",
        [
          {
            amount: Number.isFinite(computedIncome)
              ? Number(computedIncome.toFixed(2))
              : 0,
          },
        ],
        { shouldDirty: true }
      );
    }
  }, [computedIncome, setValue, watch]);

  useEffect(() => {
    if (computedExpense > 0) {
      setValue(
        "expenses",
        [
          {
            amount: Number.isFinite(computedExpense)
              ? Number(computedExpense.toFixed(2))
              : 0,
            type: "Закупка",
          },
        ],
        { shouldDirty: true }
      );
    }
  }, [computedExpense, setValue]);

  const onSubmit = async (values: FormValues) => {
    const payloadStart = {
      name: values.name,
      priceCNY: Number(values.priceCNY),
      shippingUA: values.shippingUA ?? null,
      managementUAH: values.managementUAH ?? null,
      priceInUA: values.priceInUA ?? null,
      olxUrl: values.olxUrl || null,
      pinduoduoUrl: values.pinduoduoUrl || null,
      weight: values.weight ?? null,
      sellsCount: values.sellsCount ?? null,
      purchasedCount: values.purchasedCount ?? null,
      chip: values.chip || null,
      images: (values.images || [])
        .map((i) => i.url.trim())
        .filter((u) => u.length > 0),
    };

    try {
      if (id) {
        // UPDATE (PATCH)
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadStart),
        });
        if (!res.ok) throw new Error("Failed to update product");

        // Sync expenses/incomes logic (same as old ProductEditForm)
        const initialIncomeMap = new Map(
          (initialData?.incomes || []).map((i: any) => [i.id, i])
        );
        for (const inc of values.incomes) {
          if (inc.id && initialIncomeMap.has(inc.id)) {
            await fetch(`/api/incomes`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: inc.id, amount: Number(inc.amount) }),
            });
            initialIncomeMap.delete(inc.id);
          } else {
            await fetch(`/api/incomes`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: id,
                amount: Number(inc.amount),
              }),
            });
          }
        }
        // Delete leftovers
        for (const [leftId] of initialIncomeMap) {
          await fetch(`/api/incomes`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: leftId }),
          });
        }

        const initialExpenseMap = new Map(
          (initialData?.expenses || []).map((e: any) => [e.id, e])
        );
        for (const exp of values.expenses) {
          if (exp.id && initialExpenseMap.has(exp.id)) {
            await fetch(`/api/expenses`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: exp.id,
                amount: Number(exp.amount),
                type: exp.type,
              }),
            });
            initialExpenseMap.delete(exp.id);
          } else {
            await fetch(`/api/expenses`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                productId: id,
                amount: Number(exp.amount),
                type: exp.type,
              }),
            });
          }
        }
        for (const [leftId] of initialExpenseMap) {
          await fetch(`/api/expenses`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: leftId }),
          });
        }
      } else {
        // CREATE (POST)
        // Note: The POST /api/products handler already creates a 'Shipping' expense
        // if shippingUA is present. We trust that for now.
        // Manual expenses added in the UI won't be saved unless we update the API.
        // Assuming simple create flow for now.
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadStart),
        });
        if (!res.ok) throw new Error("Failed to create product");
      }

      router.push("/");
      router.refresh();
      if (!id) reset();
    } catch (err) {
      console.error(err);
      alert("Error saving product");
    }
  };

  return (
    <Card className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        {id ? "Edit Product" : "Create Product"}
      </h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BasicFields
          register={register}
          errors={errors}
          setValue={setValue}
          watch={watch}
        />

        <ImagesFieldArray
          fields={imageFields}
          register={register}
          append={appendImage}
          remove={removeImage}
          setValue={setValue}
        />

        {/* Financial Summary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Финансовый расчет</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-3 border rounded-md">
              <p className="text-sm text-gray-600">Курс CNY → UAH</p>
              <p className="text-lg font-semibold">
                {rate > 0 ? rate.toFixed(2) : "—"}
              </p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="text-sm text-gray-600">Закупочная цена (UAH)</p>
              <div className="w-full justify-between">
                <p className="text-lg font-semibold">
                  {purchaseUnitCostUAH.toFixed(2)} ₴
                </p>
                <p className="text-sm text-muted-foreground">
                  (Всего: {totalGoodsCost.toFixed(2)} ₴)
                </p>
              </div>
            </div>
            <div className="p-3 border rounded-md">
              <p className="text-sm text-gray-600">Доход (текущий)</p>
              <p className="text-lg font-semibold">
                {computedIncome.toFixed(2)} ₴
              </p>
            </div>
            <div className="p-3 border rounded-md">
              <p className="text-sm text-gray-600">Рассчитанный расход</p>
              <p className="text-lg font-semibold">
                {computedExpense.toFixed(2)} ₴
              </p>
            </div>
            <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20 col-span-1 sm:col-span-4">
              <p className="text-sm text-gray-600 font-medium">
                Прогноз чистой прибыли (если продать всё, {purchased || 0} шт)
              </p>
              <p
                suppressHydrationWarning={true}
                className={`text-xl font-bold ${
                  potentialProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {potentialProfit.toFixed(2)} ₴
              </p>
            </div>
          </div>
        </div>

        {/* Expenses List (Editable) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Расходы (Делатизация)</label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendExpense({ amount: 0, type: "" })}
            >
              Добавить расход
            </Button>
          </div>
          <div className="space-y-2">
            {expenseFields.map((field, index) => (
              <div key={field.id} className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="flex-1 border rounded p-2"
                  placeholder="Сумма"
                  {...register(`expenses.${index}.amount` as const, {
                    valueAsNumber: true,
                  })}
                />
                <input
                  className="flex-1 border rounded p-2"
                  placeholder="Тип (напр. Закупка, Доставка)"
                  {...register(`expenses.${index}.type` as const)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => removeExpense(index)}
                >
                  X
                </Button>
              </div>
            ))}
            {expenseFields.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Нет записей расходов
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? "Сохранение..."
              : id
              ? "Сохранить изменения"
              : "Создать товар"}
          </Button>
          {id && (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
