"use client";

import { ProductCard, ProductUI } from "./ProductCard";

type ProductGridProps = {
  products: ProductUI[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-4 max-md:grid-cols-1 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
