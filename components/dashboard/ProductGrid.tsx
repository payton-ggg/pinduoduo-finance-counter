"use client";

import Link from "next/link";
import { ProductCard, ProductUI } from "./ProductCard";

type ProductGridProps = {
  products: ProductUI[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {products.map((p, index) => (
        <Link
          href={`/product/${p.id}`}
          key={p.id}
          className="animate-in fade-in zoom-in-95 duration-500 fill-mode-forwards block h-full"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <ProductCard product={p} />
        </Link>
      ))}
    </div>
  );
}
