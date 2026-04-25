"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "./Header";
import { Summary } from "./Summary";
import { ProductGrid } from "./ProductGrid";
import type { ProductUI } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Archive, Package } from "lucide-react";

interface DashboardClientProps {
  initialProducts: ProductUI[];
  globalRate?: number;
}

export function DashboardClient({
  initialProducts,
  globalRate,
}: DashboardClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductUI[]>(initialProducts);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set(),
  );
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");

  useEffect(() => {
    const filteredIds = products
      .filter((p) => (activeTab === "active" ? !p.archive : p.archive))
      .map((p) => p.id);
    setSelectedIds(new Set(filteredIds));
  }, [activeTab, products]);

  const toggleSelection = (id: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => setSelectedIds(new Set());
  const selectAll = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
    setSelectedIds(new Set(filteredIds));
  };

  const bulkArchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/products/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          archive: 1,
        }),
      });
      // We could re-fetch here or just update local state
      window.location.reload();
    } catch (err) {
      console.error("Failed to archive products", err);
    }
  };

  const bulkUnarchive = async () => {
    if (selectedIds.size === 0) return;
    try {
      await fetch("/api/products/bulk-archive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          archive: null,
        }),
      });
      window.location.reload();
    } catch (err) {
      console.error("Failed to unarchive products", err);
    }
  };

  const filteredProducts = products.filter((p) =>
    activeTab === "active" ? !p.archive : p.archive,
  );

  const selectedProducts = filteredProducts.filter((p) =>
    selectedIds.has(p.id),
  );

  const totalSpent = selectedProducts.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = selectedProducts.reduce((sum, p) => sum + p.income, 0);

  const totalProjectedRevenue = selectedProducts.reduce((sum, p) => {
    return sum + (p.totalPurchased || 0) * (p.priceInUA || 0);
  }, 0);

  const totalProjectedProfit = totalProjectedRevenue - totalSpent;

  // Update local state when initialProducts changes (from server refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  return (
    <div className="py-4 space-y-4">
      <Header
        onAdd={() => router.push("/product")}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        hasSelection={selectedIds.size > 0}
      />

      <div className="glass p-1.5 rounded-2xl flex gap-1 w-fit mb-6">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "active"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Package className="w-4 h-4" />
          Активные ({products.filter((p) => !p.archive).length})
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
            activeTab === "archive"
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105"
              : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
          }`}
        >
          <Archive className="w-4 h-4" />
          Архив ({products.filter((p) => p.archive).length})
        </button>
      </div>

      <Summary
        totalSpent={Number(totalSpent.toFixed(2))}
        totalIncome={Number(totalIncome.toFixed(2))}
        totalProjectedRevenue={Number(totalProjectedRevenue.toFixed(2))}
        totalProjectedProfit={Number(totalProjectedProfit.toFixed(2))}
        variationsCount={selectedProducts.length}
      />

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex animate-in fade-in slide-in-from-top-2 duration-500">
          {activeTab === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkArchive}
              className="glass border-none rounded-xl font-bold flex items-center gap-2 hover:bg-destructive/10 hover:text-destructive transition-all"
            >
              <Archive className="w-4 h-4" />В архив ({selectedIds.size})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkUnarchive}
              className="glass border-none rounded-xl font-bold flex items-center gap-2 hover:bg-primary/20 transition-all"
            >
              <Package className="w-4 h-4" />
              Вернуть ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      <ProductGrid
        products={filteredProducts}
        selectedIds={selectedIds}
        onToggle={toggleSelection}
        globalRate={globalRate}
      />
    </div>
  );
}
