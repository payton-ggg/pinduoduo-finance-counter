import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Info,
  Check,
} from "lucide-react";

export default async function CompareVersionsPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const productId = params.id;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true },
  });

  if (!product) return notFound();

  const variants = product.variants;
  if (variants.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        У этого товара нет версий для сравнения.
      </div>
    );
  }

  // Pre-calculate metrics for all variants
  const computedVariants = variants.map((v, idx) => {
    const rateCNY = v.rateCNY || 0;
    const priceCNY = Number(v.priceCNY) || 0;
    const priceInUA = Number(v.priceInUA) || 0;
    const purchased = Number(v.purchasedCount) || 0;
    const sells = Number(v.sellsCount) || 0;
    const shippingUA = Number(v.shippingUA) || 0;
    const managementUAH = Number(v.managementUAH) || 0;
    const unitWeight = Number(v.weight) || 0;
    const packageWeight = unitWeight * purchased;

    const unitPurchaseUAH = priceCNY * (rateCNY > 0 ? rateCNY : 1);
    const totalPurchaseUAH = unitPurchaseUAH * purchased;
    const totalExpenses = totalPurchaseUAH + shippingUA + managementUAH;

    const actualNetPrice = v.netPrice || (priceInUA > 0 ? priceInUA * 0.98 - 20 : 0);
    const potentialRevenue = actualNetPrice * purchased;
    const totalRevenue = actualNetPrice * sells;

    const potentialGrossProfit = potentialRevenue - totalPurchaseUAH;
    const currentGrossProfit = totalRevenue - totalPurchaseUAH;

    const potentialNetProfit = potentialRevenue - totalExpenses;
    const currentNetProfit = totalRevenue - totalExpenses;

    const potentialRoi = totalExpenses > 0 ? (potentialNetProfit / totalExpenses) * 100 : 0;
    const currentRoi = totalExpenses > 0 ? (currentNetProfit / totalExpenses) * 100 : 0;

    return {
      ...v,
      originalIndex: idx + 1,
      unitPurchaseUAH,
      totalPurchaseUAH,
      totalExpenses,
      actualNetPrice,
      potentialRevenue,
      totalRevenue,
      potentialGrossProfit,
      currentGrossProfit,
      potentialNetProfit,
      currentNetProfit,
      potentialRoi,
      currentRoi,
      sells,
      purchased,
      unitWeight,
      packageWeight,
      isIncluded: v.isIncluded !== false,
    };
  });

  // Find winners
  const includedVariants = computedVariants.filter((v) => v.isIncluded);

  const maxSells = Math.max(...includedVariants.map((v) => v.sells), 0);
  const maxMargin = Math.max(...includedVariants.map((v) => v.potentialNetProfit), 0);
  const maxRoi = Math.max(...includedVariants.map((v) => v.potentialRoi), 0);

  const absoluteMaxSells = Math.max(...computedVariants.map((v) => v.sells), 1);
  const absoluteMaxMargin = Math.max(
    ...computedVariants.map((v) => Math.abs(v.potentialNetProfit)),
    1,
  );

  const winnerSells = maxSells > 0 ? includedVariants.find((v) => v.sells === maxSells) : null;
  const winnerMargin = maxMargin > 0 ? includedVariants.find((v) => v.potentialNetProfit === maxMargin) : null;
  const winnerRoi = maxRoi > 0 ? includedVariants.find((v) => v.potentialRoi === maxRoi) : null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Clean Header */}
      <div className="flex flex-col gap-4 mt-4">
        <Link
          href={`/product/${product.id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад к товару
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 rounded-xl overflow-hidden border shadow-sm shrink-0">
            <Image
              src={
                (product.images &&
                  Array.isArray(product.images) &&
                  product.images[0]) ||
                "https://placehold.co/100x100"
              }
              alt={product.name}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black leading-tight line-clamp-1">
              {product.name}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Детальное сравнение версий ({variants.length})
            </p>
          </div>
        </div>
      </div>

      {/* Winners Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <WinnerCard
          title="Лидер продаж"
          icon={<ShoppingCart className="w-5 h-5 text-blue-500" />}
          winner={winnerSells}
          value={winnerSells ? `${winnerSells.sells} шт.` : "Нет данных"}
          color="blue"
        />
        <WinnerCard
          title="Макс. Потенц. Прибыль"
          icon={<DollarSign className="w-5 h-5 text-green-500" />}
          winner={winnerMargin}
          value={winnerMargin ? `${winnerMargin.potentialNetProfit.toFixed(0)} ₴` : "Нет данных"}
          color="green"
        />
        <WinnerCard
          title="Лучший Потенц. ROI"
          icon={<TrendingUp className="w-5 h-5 text-purple-500" />}
          winner={winnerRoi}
          value={winnerRoi ? `${winnerRoi.potentialRoi.toFixed(1)}%` : "Нет данных"}
          color="purple"
        />
      </div>

      {/* Comparison Grid */}
      <div className="border border-foreground/10 rounded-2xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto pb-2">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="border-b border-foreground/10 bg-muted/20">
                <th className="p-4 font-semibold text-muted-foreground sticky left-0 bg-card z-20 min-w-[150px] shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5">
                  Метрика
                </th>
                {computedVariants.map((v) => (
                  <th
                    key={v.id}
                    className={`p-4 min-w-[240px] align-top ${!v.isIncluded ? "opacity-50" : ""}`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-base text-foreground">
                          Версия {v.originalIndex}
                        </span>
                        {v.isIncluded ? (
                          <div
                            className="bg-primary/10 text-primary p-1 rounded-md"
                            title="Включена в расчет"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border border-foreground/10">
                            Исключена
                          </div>
                        )}
                      </div>
                      <div className="text-xs font-normal text-muted-foreground line-clamp-2 min-h-[32px]">
                        {v.pddSearchQuery || "—"}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-foreground/5">
              {/* Sales Row */}
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5">
                  Продажи
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50 grayscale-30" : ""}`}>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-end gap-2">
                        <span className="text-lg font-black">{v.sells}</span>
                        <span className="text-xs text-muted-foreground mb-0.5">из {v.purchased}</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${(v.sells / absoluteMaxSells) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Potential Net Profit Row */}
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5">
                  Чистая прибыль<br/>(Потенциал)
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50 grayscale-30" : ""}`}>
                    <div className="flex flex-col gap-2">
                      <span className={`text-lg font-black ${v.potentialNetProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {v.potentialNetProfit > 0 ? "+" : ""}{v.potentialNetProfit.toFixed(2)} ₴
                      </span>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden flex">
                        {v.potentialNetProfit >= 0 ? (
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(v.potentialNetProfit / absoluteMaxMargin) * 100}%` }}
                          />
                        ) : (
                          <div
                            className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(Math.abs(v.potentialNetProfit) / absoluteMaxMargin) * 100}%` }}
                          />
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">Текущая: {v.currentNetProfit > 0 ? "+" : ""}{v.currentNetProfit.toFixed(2)} ₴</div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Potential Gross Profit Row */}
              <tr className="hover:bg-muted/5 transition-colors bg-muted/10">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5 text-xs text-muted-foreground uppercase tracking-wider">
                  Грязная прибыль
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50" : ""}`}>
                    <div className="font-semibold">{v.potentialGrossProfit > 0 ? "+" : ""}{v.potentialGrossProfit.toFixed(2)} ₴</div>
                    <div className="text-xs text-muted-foreground">Текущая: {v.currentGrossProfit.toFixed(2)} ₴</div>
                  </td>
                ))}
              </tr>

              {/* ROI Row */}
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5">
                  Потенциальный ROI
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50 grayscale-30" : ""}`}>
                    <div className="flex flex-col gap-1 items-start">
                      <span
                        className={`px-2.5 py-1 rounded-lg text-sm font-bold ${v.potentialRoi >= 100 ? "bg-purple-500/10 text-purple-600" : v.potentialRoi >= 50 ? "bg-green-500/10 text-green-600" : v.potentialRoi >= 0 ? "bg-zinc-500/10 text-zinc-600" : "bg-red-500/10 text-red-600"}`}
                      >
                        {v.potentialRoi.toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-muted-foreground px-1">Текущий: {v.currentRoi.toFixed(1)}%</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Expenses Row */}
              <tr className="hover:bg-muted/5 transition-colors">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5">
                  Расход (Всего)
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50" : ""}`}>
                    <div className="font-bold text-base text-foreground mb-2">{v.totalExpenses.toFixed(2)} ₴</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between border-b border-foreground/5 pb-1">
                        <span className="text-muted-foreground">Закупка:</span>
                        <span className="font-medium">{v.totalPurchaseUAH.toFixed(2)} ₴</span>
                      </div>
                      <div className="flex justify-between border-b border-foreground/5 pb-1 pt-1">
                        <span className="text-muted-foreground">Доставка:</span>
                        <span className="font-medium">{Number(v.shippingUA || 0).toFixed(2)} ₴</span>
                      </div>
                      <div className="flex justify-between pt-1">
                        <span className="text-muted-foreground">Управление:</span>
                        <span className="font-medium">{Number(v.managementUAH || 0).toFixed(2)} ₴</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Weight Row */}
              <tr className="hover:bg-muted/5 transition-colors bg-muted/10">
                <td className="p-4 font-medium sticky left-0 bg-card z-20 shadow-[4px_0_12px_rgba(0,0,0,0.03)] border-r border-foreground/5 text-xs text-muted-foreground uppercase tracking-wider">
                  Вес
                </td>
                {computedVariants.map((v) => (
                  <td key={v.id} className={`p-4 ${!v.isIncluded ? "opacity-50" : ""}`}>
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">1 шт:</span>
                        <span className="font-semibold">{v.unitWeight > 1000 ? `${(v.unitWeight/1000).toFixed(2)} кг` : `${v.unitWeight} г`}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-muted-foreground">Посылка:</span>
                        <span className="font-semibold">{v.packageWeight > 1000 ? `${(v.packageWeight/1000).toFixed(2)} кг` : `${v.packageWeight} г`}</span>
                      </div>
                    </div>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function WinnerCard({
  title,
  icon,
  winner,
  value,
  color,
}: {
  title: string;
  icon: React.ReactNode;
  winner: any;
  value: string;
  color: string;
}) {
  const bgColors = {
    blue: "bg-blue-500/10 border-blue-500/20",
    green: "bg-green-500/10 border-green-500/20",
    purple: "bg-purple-500/10 border-purple-500/20",
  };
  const titleColors = {
    blue: "text-blue-700 dark:text-blue-400",
    green: "text-green-700 dark:text-green-400",
    purple: "text-purple-700 dark:text-purple-400",
  };

  return (
    <div
      className={`p-4 rounded-2xl border ${bgColors[color as keyof typeof bgColors]} flex flex-col gap-3 relative overflow-hidden`}
    >
      <div className="flex items-center gap-2">
        <div className="p-2 bg-background/80 backdrop-blur-md rounded-xl shadow-sm border border-foreground/5">
          {icon}
        </div>
        <p className="font-semibold text-sm opacity-90">{title}</p>
      </div>

      {winner ? (
        <div className="mt-auto">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Версия {winner.originalIndex}
          </p>
          <p
            className={`text-xl font-black ${titleColors[color as keyof typeof titleColors]}`}
          >
            {value}
          </p>
        </div>
      ) : (
        <div className="mt-auto flex items-center gap-2 text-muted-foreground">
          <Info className="w-4 h-4" />
          <p className="text-sm">Нет лидера</p>
        </div>
      )}
    </div>
  );
}
