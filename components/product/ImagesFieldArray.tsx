"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UseFieldArrayReturn, UseFormRegister, UseFormSetValue } from "react-hook-form";

type ImagesFieldArrayProps = {
  fields: { id: string }[];
  register: UseFormRegister<any>;
  append: UseFieldArrayReturn<any, "images", "id">["append"];
  remove: UseFieldArrayReturn<any, "images", "id">["remove"];
  setValue: UseFormSetValue<any>;
};

export function ImagesFieldArray({
  fields,
  register,
  append,
  remove,
  setValue,
}: ImagesFieldArrayProps) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileChange = async (index: number, file?: File) => {
    if (!file) return;
    try {
      setUploadingIndex(index);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const result = await res.json();
      const url = result.secure_url || result.url;
      if (url) {
        setValue(`images.${index}.url`, url, { shouldValidate: true, shouldDirty: true });
      }
    } catch (e) {
      console.error(e);
      alert("Error uploading image");
    } finally {
      setUploadingIndex(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">Изображения</label>
        <Button type="button" onClick={() => append({ url: "" })}>
          Добавить изображение
        </Button>
      </div>
      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex flex-col sm:flex-row gap-2">
            <input
              className="flex-1 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://…"
              {...register(`images.${index}.url` as const)}
            />
            <input
              type="file"
              accept="image/*"
              className="border rounded-md p-2 text-sm"
              onChange={(e) => handleFileChange(index, e.target.files?.[0])}
              disabled={uploadingIndex === index}
            />
            {uploadingIndex === index && (
              <span className="text-sm text-gray-600 self-center">Загрузка…</span>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => remove(index)}
            >
              Удалить
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
