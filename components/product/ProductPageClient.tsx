"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductForm from "./ProductForm";
import { ProductPreview } from "./ProductPreview";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductPageClientProps = {
  id: string;
  product: any;
  rates: { cny?: number; usd?: number };
};

export function ProductPageClient({ id, product, rates }: ProductPageClientProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold truncate mr-4">
          {product?.name || "Продукт"}
        </h1>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="inline-flex rounded-lg border p-0.5 bg-muted/30">
            <Button
              variant={mode === "preview" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("preview")}
              className="gap-1.5"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Просмотр</span>
            </Button>
            <Button
              variant={mode === "edit" ? "default" : "ghost"}
              size="sm"
              onClick={() => setMode("edit")}
              className="gap-1.5"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Редактировать</span>
            </Button>
          </div>
          <DeleteProductButton id={id} />
        </div>
      </div>

      {mode === "preview" ? (
        <ProductPreview data={product} rates={rates} />
      ) : (
        <ProductForm id={id} initialData={product} initialRates={rates} />
      )}
    </div>
  );
}
