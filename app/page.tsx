import { prisma } from "@/lib/prisma";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import type { ProductUI } from "@/components/dashboard/ProductCard";
import { getExchangeRates } from "@/lib/rates";
import { AuthGate } from "@/components/auth/AuthGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Dashboard() {
  const rates = await getExchangeRates();
  const rate = rates.cny;

  const data = await prisma.product.findMany({
    include: {
      expenses: true,
      incomes: true,
      folder: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mapped: ProductUI[] = data.map((p: any) => {
    const actualRateCNY = p.rateCNY || rate;
    const unitCost =
      (p.priceCNY || 0) * (actualRateCNY > 0 ? actualRateCNY : 1);
    const goodsCost = unitCost * (p.purchasedCount || 0);

    const spent =
      goodsCost + (Number(p.shippingUA) || 0) + (Number(p.managementUAH) || 0);

    const income = Array.isArray(p.incomes)
      ? p.incomes.reduce(
          (sum: number, i: any) => sum + (Number(i.amount) || 0),
          0,
        )
      : 0;

    const img =
      Array.isArray(p.images) && p.images.length > 0
        ? p.images[0]
        : "https://images.prom.ua/6613313628_w640_h640_naushniki-apple-airpods.jpg";

    return {
      id: p.id,
      name: p.name,
      img,
      spent,
      income,
      priceCNY: p.priceCNY || 0,
      shippingUA: p.shippingUA ?? undefined,
      managementUAH: p.managementUAH ?? undefined,
      priceInUA: p.priceInUA || 0,
      totalPurchased: p.purchasedCount || 0,
      archive: p.archive,
      rateCNY: p.rateCNY,
      rateUSD: p.rateUSD,
      folderId: p.folderId,
      folderName: p.folder?.name,
    } as ProductUI;
  });

  return (
    <AuthGate>
      <div className="container mx-auto">
        <DashboardClient initialProducts={mapped} globalRate={rate} />
      </div>
    </AuthGate>
  );
}
