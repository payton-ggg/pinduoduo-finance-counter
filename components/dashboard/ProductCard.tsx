"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";

export type ProductUI = {
  id: string | number;
  name: string;
  img: string;
  spent: number;
  income: number;
};

type ProductCardProps = {
  product: ProductUI;
};

export function ProductCard({ product }: ProductCardProps) {
  const balance = product.income - product.spent;
  const router = useRouter();

  const handleOpen = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <Card className="hover:shadow-lg transition cursor-pointer">
      <CardContent className="p-4">
        <img
          src={product.img}
          alt={product.name}
          className="w-full object-cover rounded-md mb-3"
        />
        <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600">Spent: ${product.spent}</p>
        <p className="text-sm text-gray-600">Income: ${product.income}</p>
        <p className="text-sm font-bold mt-2">
          Balance:{" "}
          <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
            {balance}
          </span>
        </p>
        <Button
          onClick={() => handleOpen()}
          variant="outline"
          className="w-full mt-3"
        >
          Open
        </Button>
      </CardContent>
    </Card>
  );
}
