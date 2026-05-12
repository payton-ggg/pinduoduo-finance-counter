import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { ProductPageClient } from "@/components/product/ProductPageClient";
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
        folder: true,
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <ProductPageClient
      id={id}
      product={JSON.parse(JSON.stringify(product))}
      rates={rates}
    />
  );
}
