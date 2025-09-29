"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Summary } from "@/components/dashboard/Summary";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import type { ProductUI } from "@/components/dashboard/ProductCard";

export default function Dashboard() {
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const mapped: ProductUI[] = (data || []).map((p: any) => {
          const spent = Array.isArray(p.expenses)
            ? p.expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
            : 0;
          const income = Array.isArray(p.incomes)
            ? p.incomes.reduce((sum: number, i: any) => sum + (i.amount || 0), 0)
            : 0;
          const img = Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : "https://via.placeholder.com/150";
          return {
            id: p.id,
            name: p.name,
            img,
            spent,
            income,
          } as ProductUI;
        });
        setProducts(mapped);
      } catch (err) {
        console.error("Failed to load products", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalSpent = products.reduce((sum, p) => sum + p.spent, 0);
  const totalIncome = products.reduce((sum, p) => sum + p.income, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Header />
      <Summary
        totalSpent={totalSpent}
        totalIncome={totalIncome}
        variationsCount={products.length}
      />
      {loading ? (
        <div className="text-center text-gray-600">Loading products...</div>
      ) : (
        <ProductGrid products={products} />
      )}
    </div>
  );
}
