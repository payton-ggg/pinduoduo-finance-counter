"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BasicFields } from "./BasicFields";
import { FlagsFields } from "./FlagsFields";
import { ImagesFieldArray } from "./ImagesFieldArray";

type FormValues = {
  name: string;
  priceUAH: number;
  priceInUA?: number;
  olxUrl?: string;
  pinduoduoUrl?: string;
  workModalWindowIOS: boolean;
  soundReducer: boolean;
  sensesOfEar: boolean;
  wirelessCharger: boolean;
  gyroscope: boolean;
  weight?: number;
  microphoneQuality?: number;
  sellsCount?: number;
  chip?: string;
  equipment?: string;
  images: { url: string }[];
};

export default function ProductForm() {
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
      priceInUA: undefined,
      olxUrl: "",
      pinduoduoUrl: "",
      workModalWindowIOS: false,
      soundReducer: false,
      sensesOfEar: false,
      wirelessCharger: false,
      gyroscope: false,
      weight: undefined,
      microphoneQuality: undefined,
      sellsCount: undefined,
      chip: "",
      equipment: "",
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
      priceInUA: values.priceInUA ?? null,
      olxUrl: values.olxUrl || null,
      pinduoduoUrl: values.pinduoduoUrl || null,
      workModalWindowIOS: values.workModalWindowIOS,
      soundReducer: values.soundReducer,
      sensesOfEar: values.sensesOfEar,
      wirelessCharger: values.wirelessCharger,
      gyroscope: values.gyroscope,
      weight: values.weight ?? null,
      microphoneQuality: values.microphoneQuality ?? null,
      sellsCount: values.sellsCount ?? null,
      chip: values.chip || null,
      equipment: values.equipment || null,
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
      await res.json();
      reset();
      router.push("/");
    } catch (err) {
      console.error(err);
      alert("Error creating product");
    }
  };

  return (
    <Card className="p-6 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Create Product</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <BasicFields register={register} errors={errors} />
        <FlagsFields register={register} />
        <ImagesFieldArray fields={fields} register={register} append={append} remove={remove} />

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating…" : "Create Product"}
        </Button>
      </form>
    </Card>
  );
}