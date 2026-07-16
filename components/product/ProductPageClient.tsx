"use client";

import { useState, useEffect } from "react";
import {
  Eye,
  Pencil,
  Calculator,
  ArrowLeft,
  Copy,
  X,
  Loader2,
  TrendingUp,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";
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
import { OlxResearchDialog } from "./OlxResearchDialog";

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
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [isUnsavedModalOpen, setIsUnsavedModalOpen] = useState(false);
  const router = useRouter();

  // Copy modal state
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isOlxModalOpen, setIsOlxModalOpen] = useState(false);
  const [activeVariantIndex, setActiveVariantIndex] = useState(0);
  const [folders, setFolders] = useState<{ id: string; name: string }[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [copyName, setCopyName] = useState("");
  const [isSubmittingCopy, setIsSubmittingCopy] = useState(false);

  useEffect(() => {
    setLocalProduct(product);
  }, [product]);

  useEffect(() => {
    if (mode === "edit") {
      setHasOpenedEdit(true);
    }
  }, [mode]);

  const handleOpenCopyModal = async () => {
    setCopyName(localProduct?.name ? `${localProduct.name} - Копия` : "Копия");
    setSelectedFolderId(localProduct?.folderId || "");
    setIsCopyModalOpen(true);

    try {
      const res = await fetch("/api/folders");
      const data = await res.json();
      if (Array.isArray(data)) {
        setFolders(data);
      }
    } catch (err) {
      console.error("Failed to load folders:", err);
    }
  };

  const handleConfirmCopy = async () => {
    if (!copyName.trim()) {
      alert("Пожалуйста, введите название товара");
      return;
    }
    if (!selectedFolderId) {
      alert("Пожалуйста, выберите папку назначения");
      return;
    }
    setIsSubmittingCopy(true);
    try {
      const res = await fetch(`/api/products/${id}/copy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: copyName,
          folderId: selectedFolderId,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to copy product");
      }

      const newProduct = await res.json();
      setIsCopyModalOpen(false);
      router.push(`/product/${newProduct.id}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error ? err.message : "Не удалось скопировать товар",
      );
    } finally {
      setIsSubmittingCopy(false);
    }
  };

  const handlePddResearch = () => {
    const activeVariant = localProduct?.variants?.[activeVariantIndex];
    const query = activeVariant?.pddSearchQuery || localProduct?.name || "";
    if (!query) return;

    const encodedQuery = encodeURIComponent(query);
    const appUrl = `pinduoduo://yangkeduo.com/search_result.html?search_key=${encodedQuery}`;
    const webUrl = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodedQuery}`;

    const isMobile =
      typeof window !== "undefined" &&
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = appUrl;
      setTimeout(() => {
        if (!document.hidden) {
          window.open(webUrl, "_blank");
        }
      }, 1500);
    } else {
      window.open(webUrl, "_blank");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 md:px-0">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/")}
          className="rounded-xl hover:bg-muted hover:scale-105 active:scale-95 transition-all duration-200"
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
            onClick={handleOpenCopyModal}
            className="gap-1.5"
            title="Копировать товар"
          >
            <Copy className="h-4 w-4" />
            <span className="hidden sm:inline">Копировать</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOlxModalOpen(true)}
            className="gap-1.5"
            title="Исследовать цены на OLX.ua"
          >
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="hidden sm:inline">Исследовать OLX</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePddResearch}
            className="gap-1.5"
            title="Исследовать цены на Pinduoduo"
          >
            <ShoppingBag className="h-4 w-4 text-red-500" />
            <span className="hidden sm:inline">Исследовать PDD</span>
          </Button>

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
              onClick={() => {
                if (mode === "edit" && isFormDirty) {
                  setIsUnsavedModalOpen(true);
                } else {
                  setMode("preview");
                }
              }}
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
        </div>
      </div>

      <div className={mode === "preview" ? "block" : "hidden"}>
        <ProductPreview
          data={localProduct}
          rates={rates}
          activeVariantIndex={activeVariantIndex}
          setActiveVariantIndex={setActiveVariantIndex}
        />
      </div>
      <DeleteProductButton id={id} />

      {hasOpenedEdit && (
        <div className={mode === "edit" ? "block" : "hidden"}>
          <ProductForm
            key={formKey}
            id={id}
            initialData={product}
            initialRates={rates}
            onSuccess={() => {
              setIsFormDirty(false);
              router.refresh();
              setFormKey((prev) => prev + 1);
              setMode("preview");
            }}
            onCancel={() => {
              setIsFormDirty(false);
              setLocalProduct(product);
              setFormKey((prev) => prev + 1);
              setMode("preview");
            }}
            onValuesChange={setLocalProduct}
            onDirtyChange={setIsFormDirty}
          />
        </div>
      )}

      {/* Copy Product Modal */}
      {isCopyModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsCopyModalOpen(false)}
        >
          <div
            className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Copy className="w-5 h-5 text-indigo-500" />
                Копировать товар
              </h2>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Название копии
                </label>
                <input
                  type="text"
                  className="w-full bg-foreground/5 border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  value={copyName}
                  onChange={(e) => setCopyName(e.target.value)}
                  placeholder="Введите название нового товара..."
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider font-bold text-muted-foreground mb-2">
                  Папка назначения
                </label>
                <select
                  className="w-full bg-background border border-foreground/10 rounded-xl px-4 py-3 text-sm font-medium text-foreground transition-all duration-300 hover:border-primary/40 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20"
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                >
                  <option value="">Выберите папку назначения...</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex items-center justify-end gap-3 bg-muted/20">
              <Button
                variant="outline"
                onClick={() => setIsCopyModalOpen(false)}
                disabled={isSubmittingCopy}
                className="font-semibold"
              >
                Отмена
              </Button>
              <Button
                onClick={handleConfirmCopy}
                disabled={isSubmittingCopy}
                className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold transition-all"
              >
                {isSubmittingCopy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Копирование...
                  </>
                ) : (
                  "Создать копию"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Confirmation Modal */}
      {isUnsavedModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => {}} // Non-closable by clicking outside
        >
          <div
            className="bg-background border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col transition-all transform scale-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <span className="p-1 rounded-md bg-amber-500/10 text-amber-500">
                  ⚠️
                </span>
                Несохраненные изменения
              </h2>
            </div>

            {/* Body */}
            <div className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Вы изменили информацию о товаре. Хотите сохранить изменения
                перед переходом в режим просмотра?
              </p>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 bg-muted/20">
              <Button
                variant="ghost"
                onClick={() => setIsUnsavedModalOpen(false)}
                className="font-semibold order-3 sm:order-1"
              >
                Отмена
              </Button>
              <Button
                onClick={() => {
                  // Discard changes
                  setIsFormDirty(false);
                  setLocalProduct(product);
                  setFormKey((prev) => prev + 1);
                  setIsUnsavedModalOpen(false);
                  setMode("preview");
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold order-2"
              >
                Забить хуй
              </Button>
              <Button
                onClick={() => {
                  // Trigger form submit programmatically
                  const formElement = document.getElementById(
                    "product-form",
                  ) as HTMLFormElement | null;
                  if (formElement) {
                    formElement.requestSubmit();
                  }
                  setIsUnsavedModalOpen(false);
                }}
                className="bg-primary text-primary-foreground font-semibold order-1 sm:order-3"
              >
                Сохранить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* OLX Price Research Dialog */}
      <OlxResearchDialog
        isOpen={isOlxModalOpen}
        onClose={() => setIsOlxModalOpen(false)}
        productId={id}
        productName={localProduct?.name || ""}
        variants={localProduct?.variants || []}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
