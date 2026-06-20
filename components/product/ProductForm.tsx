"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { VariantFields } from "./BasicFields";
import { ImagesFieldArray } from "./ImagesFieldArray";
import {
  Calculator,
  RefreshCw,
  Bot,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

type VariantValues = {
  id?: string;
  priceCNY: number;
  priceInUA?: number;
  netPrice?: number;
  weight?: number;
  pddSearchQuery?: string;
  sellsCount?: number;
  purchasedCount?: number;
  shippingUA?: number;
  managementUAH?: number;
  rateCNY?: number;
  rateUSD?: number;
  shippingType?: "air" | "sea" | "custom";
  customShippingRate?: number;
  isIncluded?: boolean;
};

type FormValues = {
  name: string;
  images: { url: string }[];
  pinduoduoUrl?: string;
  variants: VariantValues[];
  incomes: { id?: string; amount: number }[];
  expenses: { id?: string; amount: number; type: string }[];
  archive?: number | null;
  folderId?: string;
};

type ProductFormProps = {
  id?: string;
  initialData?: any;
  initialRates?: { cny?: number; usd?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
  onValuesChange?: (values: any) => void;
  onDirtyChange?: (isDirty: boolean) => void;
};

const emptyVariant = (): VariantValues => ({
  priceCNY: 0,
  shippingType: "air",
  isIncluded: true,
});

export default function ProductForm({
  id,
  initialData,
  initialRates,
  onSuccess,
  onCancel,
  onValuesChange,
  onDirtyChange,
}: ProductFormProps) {
  const router = useRouter();
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [aiText, setAiText] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [collapsedVariants, setCollapsedVariants] = useState<Set<number>>(
    new Set(),
  );
  const [deletedVariantIds, setDeletedVariantIds] = useState<string[]>([]);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then((data) => setFolders(data))
      .catch(() => {});
  }, []);

  const normalizedImages: { url: string }[] = Array.isArray(initialData?.images)
    ? initialData.images.map((img: any) =>
        typeof img === "string" ? { url: img } : { url: img?.url ?? "" },
      )
    : [{ url: "" }];

  const initialVariants: VariantValues[] =
    Array.isArray(initialData?.variants) && initialData.variants.length > 0
      ? initialData.variants.map((v: any) => ({
          id: v.id,
          priceCNY: v.priceCNY ?? 0,
          priceInUA: v.priceInUA ?? undefined,
          netPrice: v.netPrice ?? undefined,
          weight: v.weight ?? undefined,
          pddSearchQuery: v.pddSearchQuery ?? "",
          sellsCount: v.sellsCount ?? undefined,
          purchasedCount: v.purchasedCount ?? undefined,
          shippingUA: v.shippingUA ?? undefined,
          managementUAH: v.managementUAH ?? undefined,
          rateCNY: v.rateCNY ?? undefined,
          rateUSD: v.rateUSD ?? undefined,
          shippingType: v.shippingType ?? "air",
          customShippingRate: v.customShippingRate ?? undefined,
          isIncluded: v.isIncluded ?? true,
        }))
      : [emptyVariant()];

  const defaultValues: FormValues = {
    name: initialData?.name ?? "",
    images: normalizedImages,
    pinduoduoUrl: initialData?.pinduoduoUrl ?? "",
    variants: initialVariants,
    incomes: (initialData?.incomes || []).map((i: any) => ({
      id: i.id,
      amount: i.amount,
    })),
    expenses: (initialData?.expenses || []).map((e: any) => ({
      id: e.id,
      amount: e.amount,
      type: e.type,
    })),
    archive: initialData?.archive ?? null,
    folderId: initialData?.folderId ?? "",
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting, errors, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<FormValues>({ defaultValues });

  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  const watchedValues = watch();
  const serializedValues = JSON.stringify(watchedValues);

  useEffect(() => {
    if (onValuesChange) {
      onValuesChange({
        ...initialData,
        ...watchedValues,
      });
    }
  }, [serializedValues, onValuesChange, initialData]);

  const {
    fields: imageFields,
    append: appendImage,
    remove: removeImage,
  } = useFieldArray({ control, name: "images" });

  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({ control, name: "expenses" });

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const variants = watch("variants");
        const needsRates = variants.some((v) => !v.rateCNY || !v.rateUSD);
        if (!needsRates) return;

        let cny = initialRates?.cny;
        let usd = initialRates?.usd;

        if (!cny || !usd) {
          const res = await fetch("/api/rates");
          const data = await res.json();
          cny = cny || data.cny;
          usd = usd || data.usd;
        }

        variants.forEach((v, i) => {
          if (!v.rateCNY && cny) setValue(`variants.${i}.rateCNY`, cny);
          if (!v.rateUSD && usd) setValue(`variants.${i}.rateUSD`, usd);
        });
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
      }
    };
    fetchRates();
  }, [initialData, initialRates, setValue]);

  const variants = watch("variants");
  const totals = variants.reduce(
    (acc, v) => {
      if (v.isIncluded === false) return acc;

      const rateCNY = v.rateCNY || 0;
      const purchased = Number(v.purchasedCount) || 0;
      const sells = Number(v.sellsCount) || 0;
      const unitCost = (Number(v.priceCNY) || 0) * (rateCNY > 0 ? rateCNY : 1);
      const goodsCost = purchased * unitCost;
      const sellingPrice = Number(v.priceInUA) || 0;
      const actualNet =
        v.netPrice || (sellingPrice > 0 ? sellingPrice * 0.98 - 20 : 0);
      const income = sells * actualNet;
      const costs =
        goodsCost +
        (Number(v.shippingUA) || 0) +
        (Number(v.managementUAH) || 0);

      acc.totalPurchased += purchased;
      acc.totalSells += sells;
      acc.totalGoodsCost += goodsCost;
      acc.totalIncome += income;
      acc.totalCosts += costs;
      acc.totalPotentialRevenue += purchased * actualNet;
      return acc;
    },
    {
      totalPurchased: 0,
      totalSells: 0,
      totalGoodsCost: 0,
      totalIncome: 0,
      totalCosts: 0,
      totalPotentialRevenue: 0,
    },
  );

  const potentialProfit = totals.totalPotentialRevenue - totals.totalCosts;
  const margin = totals.totalIncome - totals.totalCosts;

  const toggleCollapse = (index: number) => {
    setCollapsedVariants((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleAiFill = async () => {
    if (!aiText.trim()) return;
    setIsAiLoading(true);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: aiText }),
      });
      const data = await res.json();
      if (data.error) {
        alert("Ошибка AI: " + data.error);
        return;
      }

      const parsed = data.data;
      if (parsed) {
        if (parsed.name) setValue("name", parsed.name, { shouldDirty: true });
        const variantKeys = [
          "priceCNY",
          "priceInUA",
          "netPrice",
          "weight",
          "pddSearchQuery",
          "sellsCount",
          "purchasedCount",
          "shippingUA",
          "managementUAH",
        ];
        variantKeys.forEach((key) => {
          if (parsed[key] !== null && parsed[key] !== undefined) {
            setValue(`variants.0.${key}` as any, parsed[key], {
              shouldDirty: true,
            });
          }
        });
      }
    } catch (err) {
      console.error(err);
      alert("Не удалось обработать текст с помощью AI");
    } finally {
      setIsAiLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      pinduoduoUrl: values.pinduoduoUrl || null,
      archive: values.archive ?? null,
      folderId: values.folderId || "",
      images: (values.images || [])
        .map((i) => i.url.trim())
        .filter((u) => u.length > 0),
      variants: values.variants.map((v) => ({
        id: v.id || undefined,
        priceCNY: Number(v.priceCNY) || 0,
        priceInUA: v.priceInUA ?? null,
        netPrice: v.netPrice ?? null,
        weight: v.weight ?? null,
        pddSearchQuery: v.pddSearchQuery || null,
        sellsCount: v.sellsCount ?? null,
        purchasedCount: v.purchasedCount ?? 0,
        shippingUA: v.shippingUA ?? null,
        managementUAH: v.managementUAH ?? null,
        rateCNY: v.rateCNY ?? null,
        rateUSD: v.rateUSD ?? null,
        shippingType: v.shippingType || null,
        customShippingRate: v.customShippingRate ?? null,
        isIncluded: v.isIncluded ?? true,
      })),
      deletedVariantIds,
    };

    try {
      if (id) {
        const res = await fetch(`/api/products/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to update product");

        const initialIncomeMap = new Map(
          (initialData?.incomes || []).map((i: any) => [i.id, i]),
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
        for (const [leftId] of initialIncomeMap) {
          await fetch(`/api/incomes`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: leftId }),
          });
        }

        const initialExpenseMap = new Map(
          (initialData?.expenses || []).map((e: any) => [e.id, e]),
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
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create product");
        const data = await res.json();
        router.push(`/product/${data.id}`);
        return;
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/product/${id}`);
      }
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

      <div className="mb-6 p-5 border border-primary/15 bg-primary/5 rounded-2xl relative overflow-hidden backdrop-blur-xs shadow-xs transition-all duration-300 hover:border-primary/25">
        {/* Subtle decorative background glow for AI theme */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm font-bold text-foreground">
            <Bot className="w-5 h-5 text-primary animate-pulse" />
            Автозаполнение через ИИ
          </label>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/15">
            AI Assistant
          </span>
        </div>

        <p className="text-xs text-muted-foreground mb-4">
          Опишите товар текстом, и ИИ автоматически заполнит поля первой версии.
          Фотографии затронуты не будут.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10">
          <textarea
            placeholder="Например: Товар за 150 юаней, вес 250г, продаём за 2000 грн..."
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            className="flex-1 w-full bg-background/50 border border-foreground/10 rounded-xl px-4 py-3 text-sm text-foreground transition-all duration-300 hover:border-primary/30 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/15 resize-none placeholder:text-muted-foreground/60 min-h-[80px]"
            rows={3}
          />
          <Button
            type="button"
            onClick={handleAiFill}
            disabled={isAiLoading || !aiText.trim()}
            className="sm:w-32 h-auto py-3 sm:py-0 font-semibold"
          >
            {isAiLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Заполнить"
            )}
          </Button>
        </div>
      </div>

      <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Название
          </label>
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

        <div>
          <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
            Ссылка Pinduoduo
          </label>
          <input
            className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
            {...register("pinduoduoUrl")}
            placeholder="https://mobile.yangkeduo.com/…"
          />
        </div>

        {/* Variants Carousel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Версии ({variantFields.length})
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                appendVariant(emptyVariant());
                setActiveVariantIndex(variantFields.length);
              }}
              className="flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить версию
            </Button>
          </div>

          {variantFields.length > 0 && (
            <div
              className="border border-foreground/10 rounded-xl overflow-hidden relative bg-card shadow-sm"
              onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
              onTouchMove={(e) => setTouchEnd(e.targetTouches[0].clientX)}
              onTouchEnd={() => {
                if (!touchStart || !touchEnd) return;
                const distance = touchStart - touchEnd;
                if (
                  distance > 50 &&
                  activeVariantIndex < variantFields.length - 1
                )
                  setActiveVariantIndex((prev) => prev + 1);
                if (distance < -50 && activeVariantIndex > 0)
                  setActiveVariantIndex((prev) => prev - 1);
                setTouchStart(null);
                setTouchEnd(null);
              }}
            >
              {/* Carousel Header / Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-foreground/3 border-b border-foreground/5 gap-3">
                <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={activeVariantIndex === 0}
                    onClick={() => setActiveVariantIndex((prev) => prev - 1)}
                  >
                    <ChevronDown className="h-4 w-4 rotate-90" />
                  </Button>

                  <div className="flex flex-col items-center sm:items-start overflow-hidden">
                    <span className="text-sm font-bold truncate">
                      Версия {activeVariantIndex + 1} из {variantFields.length}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {variants[activeVariantIndex]?.priceCNY
                        ? `${variants[activeVariantIndex].priceCNY}¥`
                        : "Новая"}
                    </span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    disabled={activeVariantIndex === variantFields.length - 1}
                    onClick={() => setActiveVariantIndex((prev) => prev + 1)}
                  >
                    <ChevronDown className="h-4 w-4 -rotate-90" />
                  </Button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                  <label className="flex items-center gap-2 text-sm cursor-pointer select-none bg-background/50 px-3 py-1.5 rounded-lg border border-foreground/10 hover:bg-background transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                      checked={
                        variants[activeVariantIndex]?.isIncluded !== false
                      }
                      onChange={(e) =>
                        setValue(
                          `variants.${activeVariantIndex}.isIncluded`,
                          e.target.checked,
                          { shouldDirty: true },
                        )
                      }
                    />
                    <span className="font-medium whitespace-nowrap text-xs sm:text-sm text-foreground">
                      В итоговом расчете
                    </span>
                  </label>

                  {variantFields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        const variantId = variants[activeVariantIndex]?.id;
                        if (variantId) {
                          setDeletedVariantIds((prev) => [...prev, variantId]);
                        }
                        removeVariant(activeVariantIndex);
                        if (activeVariantIndex > 0) {
                          setActiveVariantIndex((prev) => prev - 1);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5 relative bg-background/30">
                <div className="transition-all">
                  <VariantFields
                    key={activeVariantIndex}
                    prefix={`variants.${activeVariantIndex}`}
                    register={register}
                    setValue={setValue}
                    watch={watch}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border rounded-md bg-muted/30">
          <label htmlFor="folderId" className="text-sm font-medium block mb-2">
            Папка
          </label>
          <select
            id="folderId"
            className="w-full border rounded p-2 text-sm bg-background"
            {...register("folderId", { required: "Выберите папку" })}
            value={watch("folderId") || ""}
          >
            <option value="">Выберите папку...</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          {errors.folderId && (
            <p className="text-red-600 text-sm mt-1">
              {String(errors.folderId.message)}
            </p>
          )}
        </div>

        {id && (
          <div className="flex items-center gap-2 p-4 border rounded-md bg-muted/30">
            <input
              type="checkbox"
              id="archive"
              className="w-4 h-4 rounded"
              checked={
                watch("archive") !== null && watch("archive") !== undefined
              }
              onChange={(e) => setValue("archive", e.target.checked ? 1 : null)}
            />
            <label
              htmlFor="archive"
              className="text-sm font-medium cursor-pointer"
            >
              Переместить в архив
            </label>
          </div>
        )}

        <ImagesFieldArray
          fields={imageFields}
          register={register}
          append={appendImage}
          remove={removeImage}
          setValue={setValue}
        />

        {/* Financial summary */}
        <div className="overflow-x-auto">
          <label className="text-sm font-medium block mb-2">
            Финансовый расчет (суммарно)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-3 border rounded-md min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">Общий расход</p>
              <p className="text-base sm:text-lg font-semibold wrap-break-word">
                {totals.totalCosts.toFixed(2)} ₴
              </p>
            </div>
            <div className="p-3 border rounded-md min-w-0">
              <p className="text-xs sm:text-sm text-gray-600">
                Доход (текущий, чистый)
              </p>
              <p className="text-base sm:text-lg font-semibold wrap-break-word">
                {totals.totalIncome.toFixed(2)} ₴
              </p>
            </div>
            <div className="p-3 border rounded-md bg-green-50/50 dark:bg-green-900/20 col-span-1 sm:col-span-2 lg:col-span-2 min-w-0">
              <p className="text-xs sm:text-sm text-gray-600 font-medium wrap-break-word">
                Прогноз чистой прибыли (если продать всё,{" "}
                {totals.totalPurchased} шт)
              </p>
              <p
                suppressHydrationWarning={true}
                className={`text-lg sm:text-xl font-bold wrap-break-word ${
                  potentialProfit >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {potentialProfit.toFixed(2)} ₴
              </p>
            </div>
            <div
              className={`p-3 border rounded-md relative col-span-1 sm:col-span-2 lg:col-span-4 min-w-0 ${margin >= 0 ? "bg-green-50/50 dark:bg-green-900/20" : "bg-orange-50/50 dark:bg-orange-900/20"}`}
            >
              <p className="text-xs sm:text-sm text-gray-600 font-medium wrap-break-word mb-1">
                Маржа ({totals.totalSells} шт из {totals.totalPurchased} шт)
              </p>
              <p
                suppressHydrationWarning={true}
                className={`text-lg sm:text-xl font-bold wrap-break-word ${
                  margin >= 0 ? "text-green-600" : "text-orange-600"
                }`}
              >
                {margin >= 0 ? "+" : ""}
                {margin.toFixed(2)} ₴
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
            <div className="flex items-center justify-between gap-2 w-full">
              <label className="text-sm font-medium">
                Расходы (Детализация)
              </label>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => appendExpense({ amount: 0, type: "" })}
              className="w-full sm:w-auto"
            >
              Добавить расход
            </Button>
          </div>
          <div className="space-y-2">
            {expenseFields.map((field, index) => (
              <div key={field.id} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="number"
                  step="0.01"
                  className="w-full sm:flex-1 border rounded p-2 text-sm sm:text-base min-w-0"
                  placeholder="Сумма"
                  {...register(`expenses.${index}.amount` as const, {
                    valueAsNumber: true,
                  })}
                />
                <input
                  className="w-full sm:flex-1 border rounded p-2 text-sm sm:text-base min-w-0"
                  placeholder="Тип (напр. Закупка, Доставка)"
                  {...register(`expenses.${index}.type` as const)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="text-red-500 w-full sm:w-auto"
                  onClick={() => removeExpense(index)}
                >
                  Удалить
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

        <div className="flex justify-between flex-col gap-2">
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
              onClick={() => {
                if (onCancel) onCancel();
                else router.back();
              }}
              className="w-full sm:w-auto"
            >
              Отмена
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}
