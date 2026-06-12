import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { ProductPageClient } from "@/components/product/ProductPageClient";
import { notFound, redirect } from "next/navigation";
import { getExchangeRates } from "@/lib/rates";
import { getAuthRole } from "@/lib/auth";

export default async function ProductId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const role = await getAuthRole();
  if (!role) {
    redirect("/");
  }

  const { id } = await params;

  const [rates, product] = await Promise.all([
    getExchangeRates(),
    prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
        expenses: true,
        incomes: true,
        folder: true,
      },
    }),
  ]);

  if (!product) {
    notFound();
  }

  if (role === "restricted" && !product.folder.allowedForSecondPassword) {
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
