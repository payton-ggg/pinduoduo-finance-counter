"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

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

  return (
    <Card className="hover:shadow-lg transition cursor-pointer">
      <CardContent className="p-4">
        <Image
          src={product.img}
          alt={product.name}
          className="w-full h-32 object-cover rounded-md mb-3"
          width={100}
          height={100}
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
        <Button variant="outline" className="w-full mt-3">
          Open
        </Button>
      </CardContent>
    </Card>
  );
}