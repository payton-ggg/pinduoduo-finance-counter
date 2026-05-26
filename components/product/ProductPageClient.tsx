"use client";

import { useState, useEffect } from "react";
import { Eye, Pencil, Calculator, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const ProductForm = dynamic(() => import("./ProductForm"), {
  loading: () => (
    <div className="flex items-center justify-center p-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  ),
  ssr: false,
});
import { ProductPreview } from "./ProductPreview";
import { DeleteProductButton } from "./DeleteProductButton";

type ProductPageClientProps = {
  id: string;
  product: any;
  rates: { cny?: number; usd?: number };
};

export function ProductPageClient({
  id,
  product,
  rates,
}: ProductPageClientProps) {
  const [mode, setMode] = useState<"preview" | "edit">("preview");
  const [hasOpenedEdit, setHasOpenedEdit] = useState(false);
  const [localProduct, setLocalProduct] = useState(product);
  const [formKey, setFormKey] = useState(0);
  const router = useRouter();

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  useEffect(() => {
    if (mode === "edit") {
      setHasOpenedEdit(true);
    }
  }, [mode]);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/")}
          className="gap-1.5"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl sm:text-3xl font-bold truncate mr-4">
          {localProduct?.name || "Продукт"}
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(
                `/calculator?from=${encodeURIComponent(window.location.pathname)}`,
              )
            }
            className="gap-1.5"
          >
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Калькулятор</span>
          </Button>
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

      <div className={mode === "preview" ? "block" : "hidden"}>
        <ProductPreview data={localProduct} rates={rates} />
      </div>

      {hasOpenedEdit && (
        <div className={mode === "edit" ? "block" : "hidden"}>
          <ProductForm
            key={formKey}
            id={id}
            initialData={product}
            initialRates={rates}
            onSuccess={() => {
              router.refresh();
              setFormKey((prev) => prev + 1);
              setMode("preview");
            }}
            onCancel={() => {
              setLocalProduct(product);
              setFormKey((prev) => prev + 1);
              setMode("preview");
            }}
            onValuesChange={setLocalProduct}
          />
        </div>
      )}
    </div>
  );
}
