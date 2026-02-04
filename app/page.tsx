"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Summary } from "@/components/dashboard/Summary";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import type { ProductUI } from "@/components/dashboard/ProductCard";
import { Button } from "@/components/ui/button";
import { Archive, Package } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");

  const loadProducts = async () => {
    try {
      // Fetch exchange rate first
      let rate = 1;
      try {
        const rateRes = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json"
        );
        const rateData = await rateRes.json();
        if (rateData && rateData.length > 0) {
          rate = rateData[0].rate;
        }
      } catch (e) {
        console.error("Failed to fetch rate, using 1", e);
      }

      const res = await fetch("/api/products");
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      }
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];

      const mapped: ProductUI[] = (data || []).map((p: any) => {
        // Calculate expenses dynamically to Fix Data Mismatch
        // Formula: (PriceCNY * Rate * PurchasedCount) + Shipping + Management
        const unitCost = (p.priceCNY || 0) * (rate > 0 ? rate : 1);
        const goodsCost = unitCost * (p.purchasedCount || 0);

        const spent =
          goodsCost +
          (typeof p.shippingUA === "number" ? p.shippingUA : 0) +
          (typeof p.managementUAH === "number" ? p.managementUAH : 0);

        const income = Array.isArray(p.incomes)
          ? p.incomes.reduce(
              (sum: number, i: any) => sum + (i.amount || 0),
              0
            )
          : 0;
        const img =
          Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : "https://images.prom.ua/6613313628_w640_h640_naushniki-apple-airpods.jpg";
        return {
          id: p.id,
          name: p.name,
          img,
          spent,
          income,
          priceCNY: p.priceCNY || 0,
          shippingUA:
            typeof p.shippingUA === "number" ? p.shippingUA : undefined,
          managementUAH:
            typeof p.managementUAH === "number" ? p.managementUAH : undefined,
          priceInUA: p.priceInUA || 0,
          totalPurchased: p.purchasedCount || 0,
          archive: p.archive,
        } as ProductUI;
      });
      setProducts(mapped);
      // Default select all for current tab
      const filteredIds = mapped
        .filter((p) =>
          activeTab === "active" ? !p.archive : p.archive
        )
        .map((p) => p.id);
      setSelectedIds(new Set(filteredIds));
      console.log("Products loaded:", mapped);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Re-select all when tab changes
  useEffect(() => {
    const filteredIds = products
      .filter((p) =>
        activeTab === "active" ? !p.archive : p.archive
      )
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
      await loadProducts();
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
      await loadProducts();
    } catch (err) {
      console.error("Failed to unarchive products", err);
    }
  };

  const filteredProducts = products.filter((p) =>
    activeTab === "active" ? !p.archive : p.archive
  );

  const selectedProducts = filteredProducts.filter((p) =>
    selectedIds.has(p.id)
  );
  const totalSpent = selectedProducts.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = selectedProducts.reduce((sum, p) => sum + p.income, 0);

  return (
    <div className="py-4 space-y-4">
      <Header
        onAdd={() => router.push("/product")}
        onClearSelection={clearSelection}
        onSelectAll={selectAll}
        hasSelection={selectedIds.size > 0}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("active")}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === "active"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="w-4 h-4" />
          Активные ({products.filter((p) => !p.archive).length})
        </button>
        <button
          onClick={() => setActiveTab("archive")}
          className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
            activeTab === "archive"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive className="w-4 h-4" />
          Архив ({products.filter((p) => p.archive).length})
        </button>
      </div>

      <Summary
        totalSpent={Number(totalSpent.toFixed(2))}
        totalIncome={Number(totalIncome.toFixed(2))}
        variationsCount={selectedProducts.length}
      />

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex gap-2">
          {activeTab === "active" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkArchive}
              className="flex items-center gap-2"
            >
              <Archive className="w-4 h-4" />
              Переместить в архив ({selectedIds.size})
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={bulkUnarchive}
              className="flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              Вернуть из архива ({selectedIds.size})
            </Button>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600">Loading products...</div>
      ) : (
        <ProductGrid
          products={filteredProducts}
          selectedIds={selectedIds}
          onToggle={toggleSelection}
        />
      )}
    </div>
  );
}
