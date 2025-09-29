"use client";

import { Card } from "@/components/ui/card";

type SummaryProps = {
  totalSpent: number;
  totalIncome: number;
  variationsCount: number;
};

export function Summary({ totalSpent, totalIncome, variationsCount }: SummaryProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card className="p-4 sm:p-5 text-center">
        <h2 className="text-lg font-semibold">Итого расходы</h2>
        <p className="text-xl font-bold text-red-600">{totalSpent} ₴</p>
      </Card>
      <Card className="p-4 sm:p-5 text-center">
        <h2 className="text-lg font-semibold">Итого доходы</h2>
        <p className="text-xl font-bold text-green-600">{totalIncome} ₴</p>
      </Card>
      <Card className="p-4 sm:p-5 text-center">
        <h2 className="text-lg font-semibold">Вариации</h2>
        <p className="text-xl font-bold">{variationsCount}</p>
      </Card>
    </div>
  );
}