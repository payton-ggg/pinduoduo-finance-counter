"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { BasicFields } from "./BasicFields";
import { FlagsFields } from "./FlagsFields";
import { ImagesFieldArray } from "./ImagesFieldArray";

type ProductEditFormProps = {
  id: string;
  initialData: any;
};

type FormValues = {
  name: string;
  images: { url: string }[];
  olxUrl?: string;
  pinduoduoUrl?: string;
  priceCNY?: number;
  workModalWindowIOS?: boolean;
  soundReducer?: boolean;
  sensesOfEar?: boolean;
  wirelessCharger?: boolean;
  gyroscope?: boolean;
  weight?: number;
  microphoneQuality?: string;
  sellsCount?: number;
  purchasedCount?: number;
  chip?: string;
  equipment?: string;
  priceInUA?: number;
  incomes: { id?: string; amount: number }[];
  expenses: { id?: string; amount: number; type: string }[];
};

export function ProductEditForm({ id, initialData }: ProductEditFormProps) {
  const router = useRouter();
  const [rate, setRate] = useState<number>(0);

  const normalizedImages: { url: string }[] = Array.isArray(initialData?.images)
    ? initialData.images.map((img: any) =>
        typeof img === "string" ? { url: img } : { url: img?.url ?? "" }
      )
    : [];

  const defaultValues: FormValues = {
    name: initialData?.name ?? "",
    images: normalizedImages,
    olxUrl: initialData?.olxUrl ?? "",
    pinduoduoUrl: initialData?.pinduoduoUrl ?? "",
    priceCNY: initialData?.priceCNY ?? initialData?.priceUAH ?? undefined,
    workModalWindowIOS: initialData?.workModalWindowIOS ?? false,
    soundReducer: initialData?.soundReducer ?? false,
    sensesOfEar: initialData?.sensesOfEar ?? false,
    wirelessCharger: initialData?.wirelessCharger ?? false,
    gyroscope: initialData?.gyroscope ?? false,
    weight: initialData?.weight ?? undefined,
    microphoneQuality: initialData?.microphoneQuality ?? "",
    sellsCount: initialData?.sellsCount ?? undefined,
    purchasedCount: initialData?.purchasedCount ?? undefined,
    chip: initialData?.chip ?? "",
    equipment: initialData?.equipment ?? "",
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
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
    watch,
  } = useForm<FormValues>({ defaultValues });

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });
  const {
    fields: incomeFields,
    append: appendIncome,
    remove: removeIncome,
  } = useFieldArray({ control, name: "incomes" });
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
  const purchaseUAH = (Number(priceCNY) || 0) * (rate > 0 ? rate : 1);
  const sellingUAH = Number(priceInUA) || 0;
  const computedIncome = (Number(sells) || 0) * sellingUAH;
  const computedExpense = (Number(purchased) || 0) * purchaseUAH;

  useEffect(() => {
    // Авто‑доход от продаж: sellsCount * priceInUA
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
    // Авто‑расход от закупки: purchasedCount * (priceCNY * rate)
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
  }, [computedIncome, computedExpense, setValue]);

  const onSubmit = async (values: FormValues) => {
    const payload = {
      ...values,
      images: values.images.map((i) => ({ url: i.url })),
    };
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      alert("Не удалось обновить продукт");
      return;
    }
    // Sync incomes (автоматический доход по количеству продаж и курсу)
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
          body: JSON.stringify({ productId: id, amount: Number(inc.amount) }),
        });
      }
    }
    for (const [leftId] of initialIncomeMap) {
      await fetch(`/api/incomes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: leftId }),
      });
    }

    // Sync expenses
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
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <BasicFields register={register} errors={{}} />
      <FlagsFields register={register} />
      <ImagesFieldArray
        fields={imageFields}
        register={register}
        append={appendImage}
        remove={removeImage}
        setValue={setValue}
      />

      {/* Доходы/Расходы (авторасчёт) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Доходы / Расходы</label>
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
            <p className="text-lg font-semibold">{purchaseUAH.toFixed(2)} ₴</p>
          </div>
          <div className="p-3 border rounded-md">
            <p className="text-sm text-gray-600">Продажная цена (UAH)</p>
            <p className="text-lg font-semibold">{sellingUAH.toFixed(2)} ₴</p>
          </div>
          <div className="p-3 border rounded-md">
            <p className="text-sm text-gray-600">Рассчитанный доход</p>
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
        </div>
      </div>

      {/* Расходы */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Расходы</label>
          <Button
            type="button"
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
                placeholder="Тип"
                {...register(`expenses.${index}.type` as const)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeExpense(index)}
              >
                Удалить
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Сохраняю…" : "Сохранить"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  );
}

export default ProductEditForm;
