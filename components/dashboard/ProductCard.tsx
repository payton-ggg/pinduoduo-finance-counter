"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export type ProductUI = {
  id: string | number;
  name: string;
  img: string;
  spent: number;
  income: number;
  priceCNY: number;
  priceInUA?: number;
};

type ProductCardProps = {
  product: ProductUI;
};

export function ProductCard({ product }: ProductCardProps) {
  const [rate, setRate] = useState(0);
  const balance = product.income - product.spent;
  const router = useRouter();

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json"
        );
        const data = await response.json();
        if (data && data.length > 0) {
          setRate(data[0].rate);
        }
      } catch (error) {
        console.error("Failed to fetch exchange rate:", error);
      }
    };

    fetchRate();
  }, []);

  const handleOpen = () => {
    router.push(`/product/${product.id}`);
  };

  return (
    <Card className="border border-gray-200 hover:border-gray-300 hover:shadow-md transition cursor-pointer">
      <CardContent className="p-4 sm:p-5">
        <img
          src={product.img}
          alt={product.name}
          className="w-full object-cover rounded-lg mb-3 aspect-[4/3] h-40 sm:h-48"
        />
        <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
        <p className="text-sm text-gray-600">Spent: {product.spent} ₴</p>
        <p className="text-sm text-gray-600">Income: {product.income} ₴</p>
        <p className="text-sm font-semibold mt-2">
          Balance:{" "}
          <span className={balance >= 0 ? "text-green-600" : "text-red-600"}>
            {balance}₴
          </span>
        </p>
        <p className="text-sm mt-4 text-gray-600">
          Закупка: {rate > 0 ? `${(product.priceCNY * rate).toFixed(2)}₴ | ${product.priceCNY}¥` : `${product.priceCNY}¥`}
        </p>
        <p className="text-sm text-gray-600">Продажа: {product.priceInUA || "N/A"}₴</p>
        <Button
          onClick={() => handleOpen()}
          variant="outline"
          className="w-full mt-3 cursor-pointer"
        >
          Open
        </Button>
      </CardContent>
    </Card>
  );
}
