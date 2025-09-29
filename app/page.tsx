"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Image from "next/image";

export default function Dashboard() {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: "AirPods Pro Replica",
      spent: 250,
      income: 400,
      img: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Sony WH-1000XM5 Replica",
      spent: 500,
      income: 750,
      img: "https://via.placeholder.com/150",
    },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🎧 My Headphones Manager</h1>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Variation
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4 text-center">
          <h2 className="text-lg font-semibold">Total Spent</h2>
          <p className="text-xl font-bold text-red-600">
            ${products.reduce((sum, p) => sum + p.spent, 0)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <h2 className="text-lg font-semibold">Total Income</h2>
          <p className="text-xl font-bold text-green-600">
            ${products.reduce((sum, p) => sum + p.income, 0)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <h2 className="text-lg font-semibold">Variations</h2>
          <p className="text-xl font-bold">{products.length}</p>
        </Card>
      </div>

      {/* Product Variations */}
      <div className="grid grid-cols-3 gap-6">
        {products.map((p) => (
          <Card
            key={p.id}
            className="hover:shadow-lg transition cursor-pointer"
          >
            <CardContent className="p-4">
              <Image
                src={p.img}
                alt={p.name}
                className="w-full h-32 object-cover rounded-md mb-3"
                width={100}
                height={100}
              />
              <h3 className="text-lg font-semibold mb-1">{p.name}</h3>
              <p className="text-sm text-gray-600">Spent: ${p.spent}</p>
              <p className="text-sm text-gray-600">Income: ${p.income}</p>
              <p className="text-sm font-bold mt-2">
                Balance:{" "}
                <span
                  className={
                    p.income - p.spent >= 0 ? "text-green-600" : "text-red-600"
                  }
                >
                  {p.income - p.spent}
                </span>
              </p>
              <Button variant="outline" className="w-full mt-3">
                Open
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
