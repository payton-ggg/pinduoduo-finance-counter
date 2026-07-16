import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export const revalidate = 0;
import { notFound, redirect } from "next/navigation";
import { getExchangeRates } from "@/lib/rates";
import { getAuthRole } from "@/lib/auth";
import { Suspense } from "react";
import Loading from "@/app/loading";
import { ProductOverviewClient } from "@/components/product/ProductOverviewClient";

async function OverviewDataWrapper({ id, role }: { id: string; role: string }) {
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
    <ProductOverviewClient
      id={id}
      product={JSON.parse(JSON.stringify(product))}
      rates={rates}
    />
  );
}

export default async function ProductOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const role = await getAuthRole();
  if (!role) {
    redirect("/");
  }

  const { id } = await params;

  return (
    <Suspense fallback={<Loading />}>
      <OverviewDataWrapper id={id} role={role} />
    </Suspense>
  );
}
