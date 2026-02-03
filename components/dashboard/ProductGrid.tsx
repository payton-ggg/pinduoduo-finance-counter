"use client";

import Link from "next/link";
import { ProductCard, ProductUI } from "./ProductCard";

type ProductGridProps = {
  products: ProductUI[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 min-[450px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
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
