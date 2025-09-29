"use client";

import Link from "next/link";
import { ProductCard, ProductUI } from "./ProductCard";

type ProductGridProps = {
  products: ProductUI[];
};

export function ProductGrid({ products }: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 cursor-pointer">
      {products.map((p) => (
        <Link href={`/product/${p.id}`} key={p.id}>
          <ProductCard product={p} />
        </Link>
      ))}
    </div>
  );
}
