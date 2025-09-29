"use client";

import { Button } from "@/components/ui/button";
import { UseFieldArrayReturn, UseFormRegister } from "react-hook-form";

type ImagesFieldArrayProps = {
  fields: { id: string }[];
  register: UseFormRegister<any>;
  append: UseFieldArrayReturn<any, "images", "id">["append"];
  remove: UseFieldArrayReturn<any, "images", "id">["remove"];
};

export function ImagesFieldArray({ fields, register, append, remove }: ImagesFieldArrayProps) {
  return (
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
  );
}