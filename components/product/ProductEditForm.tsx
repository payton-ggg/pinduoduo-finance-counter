"use client";

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
  priceUAH?: number;
  workModalWindowIOS?: boolean;
  soundReducer?: boolean;
  sensesOfEar?: boolean;
  wirelessCharger?: boolean;
  gyroscope?: boolean;
  weight?: number;
  microphoneQuality?: string;
  sellsCount?: number;
  chip?: string;
  equipment?: string;
  priceInUA?: number;
};

export function ProductEditForm({ id, initialData }: ProductEditFormProps) {
  const router = useRouter();

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
    priceUAH: initialData?.priceUAH ?? undefined,
    workModalWindowIOS: initialData?.workModalWindowIOS ?? false,
    soundReducer: initialData?.soundReducer ?? false,
    sensesOfEar: initialData?.sensesOfEar ?? false,
    wirelessCharger: initialData?.wirelessCharger ?? false,
    gyroscope: initialData?.gyroscope ?? false,
    weight: initialData?.weight ?? undefined,
    microphoneQuality: initialData?.microphoneQuality ?? "",
    sellsCount: initialData?.sellsCount ?? undefined,
    chip: initialData?.chip ?? "",
    equipment: initialData?.equipment ?? "",
    priceInUA: initialData?.priceInUA ?? undefined,
  };

  const {
    register,
    control,
    handleSubmit,
    formState: { isSubmitting },
    setValue,
  } = useForm<FormValues>({ defaultValues });

  const { fields, append, remove } = useFieldArray({ control, name: "images" });

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
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <BasicFields register={register} errors={{}} />
      <FlagsFields register={register} />
      <ImagesFieldArray
        fields={fields}
        register={register}
        append={append}
        remove={remove}
        setValue={setValue}
      />

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
