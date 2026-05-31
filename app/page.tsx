import { Suspense } from "react";
import Loading from "./loading";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { ProductUI } from "@/components/dashboard/ProductCard";
import { getExchangeRates } from "@/lib/rates";
import { AuthGate } from "@/components/auth/AuthGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function DashboardDataWrapper({
  initialFolderId,
  initialActiveTab,
}: {
  initialFolderId: string | null;
  initialActiveTab: "active" | "archive";
}) {
  const rates = await getExchangeRates();
  const rate = rates.cny;

  const data = await prisma.product.findMany({
    include: {
      variants: true,
      expenses: true,
      incomes: true,
      folder: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mapped: ProductUI[] = data.map((p: any) => {
    const variants: any[] = Array.isArray(p.variants) ? p.variants : [];

    let totalSpent = 0;
    let totalPurchased = 0;
    let totalSells = 0;
    let totalShipping = 0;
    let totalManagement = 0;
    let totalWeight = 0;
    let firstPriceCNY = 0;
    let firstPriceInUA = 0;
    let firstNetPrice: number | undefined;
    let firstRateCNY: number | undefined;
    let firstRateUSD: number | undefined;

    let hasSetFirst = false;
    variants.forEach((v, i) => {
      if (v.isIncluded === false) return;

      const actualRateCNY = v.rateCNY || rate;
      const unitCost = (v.priceCNY || 0) * (actualRateCNY > 0 ? actualRateCNY : 1);
      const purchased = Number(v.purchasedCount) || 0;
      const goodsCost = unitCost * purchased;
      const shipping = Number(v.shippingUA) || 0;
      const management = Number(v.managementUAH) || 0;

      totalSpent += goodsCost + shipping + management;
      totalPurchased += purchased;
      totalSells += Number(v.sellsCount) || 0;
      totalShipping += shipping;
      totalManagement += management;
      totalWeight += (Number(v.weight) || 0) * purchased;

      if (!hasSetFirst) {
        firstPriceCNY = v.priceCNY || 0;
        firstPriceInUA = v.priceInUA || 0;
        firstNetPrice = v.netPrice;
        firstRateCNY = v.rateCNY;
        firstRateUSD = v.rateUSD;
        hasSetFirst = true;
      }
    });

    if (!hasSetFirst && variants.length > 0) {
      const v = variants[0];
      firstPriceCNY = v.priceCNY || 0;
      firstPriceInUA = v.priceInUA || 0;
      firstNetPrice = v.netPrice;
      firstRateCNY = v.rateCNY;
      firstRateUSD = v.rateUSD;
    }

    const income = Array.isArray(p.incomes)
      ? p.incomes.reduce(
          (sum: number, i: any) => sum + (Number(i.amount) || 0),
          0,
        )
      : 0;

    const img =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images[0]
        : "https://placehold.co/400x300?text=No+Image";

    return {
      id: p.id,
      name: p.name,
      img,
      spent: totalSpent,
      income,
      priceCNY: firstPriceCNY,
      variantsList: variants.filter((v: any) => v.isIncluded !== false).map((v: any) => ({
        priceCNY: Number(v.priceCNY) || 0,
        priceInUA: Number(v.priceInUA) || 0,
        rateCNY: v.rateCNY,
      })),
      shippingUA: totalShipping || undefined,
      managementUAH: totalManagement || undefined,
      priceInUA: firstPriceInUA || 0,
      netPrice: firstNetPrice,
      totalPurchased,
      sellsCount: totalSells,
      archive: p.archive,
      rateCNY: firstRateCNY,
      rateUSD: firstRateUSD,
      folderId: p.folderId,
      folderName: p.folder?.name,
      weight: totalWeight || null,
      variantCount: variants.length,
    } as ProductUI;
  });

  return (
    <DashboardClient
      initialProducts={mapped}
      globalRate={rate}
      initialFolderId={initialFolderId}
      initialActiveTab={initialActiveTab}
    />
  );
}

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string; activeTab?: string }> | { folderId?: string; activeTab?: string };
}) {
  const resolvedSearchParams = await (searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams));
  const initialFolderId = resolvedSearchParams?.folderId || null;
  const initialActiveTab = (resolvedSearchParams?.activeTab as "active" | "archive") || "active";

  return (
    <AuthGate>
      <div className="container mx-auto">
        <Suspense fallback={<Loading />}>
          <DashboardDataWrapper
            initialFolderId={initialFolderId}
            initialActiveTab={initialActiveTab}
          />
        </Suspense>
      </div>
    </AuthGate>
  );
}
