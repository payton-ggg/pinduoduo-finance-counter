"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/dashboard/Header";
import { Summary } from "@/components/dashboard/Summary";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import type { ProductUI } from "@/components/dashboard/ProductCard";

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductUI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const mapped: ProductUI[] = (data || []).map((p: any) => {
          const spent = Array.isArray(p.expenses)
            ? p.expenses.reduce(
                (sum: number, e: any) => sum + (e.amount || 0),
                0
              )
            : 0;
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
            priceInUA: p.priceInUA || 0,
          } as ProductUI;
        });
        setProducts(mapped);
        console.log("Products loaded:", mapped);
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
    <div className="py-8 space-y-6">
      <Header onAdd={() => router.push("/product")} />
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
