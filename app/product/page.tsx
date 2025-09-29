"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type FormValues = {
  name: string;
  priceUAH: number;
  olxUrl?: string;
  pinduoduoUrl?: string;
  workModalWindowIOS: boolean;
  soundReducer: boolean;
  images: { url: string }[];
};

export default function CreateProduct() {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      priceUAH: 0,
      olxUrl: "",
      pinduoduoUrl: "",
      workModalWindowIOS: false,
      soundReducer: false,
      images: [{ url: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "images",
  });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      name: values.name,
      priceUAH: Number(values.priceUAH),
      olxUrl: values.olxUrl || null,
      pinduoduoUrl: values.pinduoduoUrl || null,
      workModalWindowIOS: values.workModalWindowIOS,
      soundReducer: values.soundReducer,
      images: (values.images || [])
        .map((i) => i.url.trim())
        .filter((u) => u.length > 0),
    };

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create product");
      const created = await res.json();
      reset();
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Error creating product");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Card className="p-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold mb-4">Create Product</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full border rounded p-2"
              {...register("name", { required: "Name is required" })}
              placeholder="AirPods Pro Replica"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Price (UAH)</label>
            <input
              type="number"
              step="0.01"
              className="w-full border rounded p-2"
              {...register("priceUAH", {
                required: "Price is required",
                valueAsNumber: true,
                min: { value: 0, message: "Price must be >= 0" },
              })}
              placeholder="499.99"
            />
            {errors.priceUAH && (
              <p className="text-red-600 text-sm mt-1">{errors.priceUAH.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">OLX URL</label>
            <input
              className="w-full border rounded p-2"
              {...register("olxUrl")}
              placeholder="https://www.olx.ua/…"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Pinduoduo URL</label>
            <input
              className="w-full border rounded p-2"
              {...register("pinduoduoUrl")}
              placeholder="https://mobile.yangkeduo.com/…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register("workModalWindowIOS")} />
              <span>Work Modal Window iOS</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" {...register("soundReducer")} />
              <span>Sound Reducer</span>
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Images</label>
              <Button type="button" onClick={() => append({ url: "" })}>
                Add Image
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <input
                    className="flex-1 border rounded p-2"
                    placeholder="https://…"
                    {...register(`images.${index}.url` as const)}
                  />
                  <Button type="button" variant="outline" onClick={() => remove(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating…" : "Create Product"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
