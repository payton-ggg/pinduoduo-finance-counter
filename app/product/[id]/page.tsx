import { prisma } from "@/lib/prisma";
import ProductForm from "@/components/product/ProductForm";
import { DeleteProductButton } from "@/components/product/DeleteProductButton";
import { notFound } from "next/navigation";
import { getExchangeRates } from "@/lib/rates";

export default async function ProductId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [rates, product] = await Promise.all([
    getExchangeRates(),
    prisma.product.findUnique({
      where: { id },
      include: {
        expenses: true,
        incomes: true,
      },
    })
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Редактирование продукта
        </h1>
        <DeleteProductButton id={id} />
      </div>
      <ProductForm id={id} initialData={product} initialRates={rates} />
    </div>
  );
}
