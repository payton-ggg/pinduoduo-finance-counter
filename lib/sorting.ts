import type { ProductUI } from "@/components/dashboard/ProductCard";

export type SortKey =
  | "default"
  | "price_sale"
  | "roi"
  | "purchase_sale_sum"
  | "best_sales"
  | "large_purchases"
  | "sales_purchases_ratio";

export type SortDirection = "asc" | "desc";

export interface ProductMetrics {
  salePrice: number;
  roi: number;
  purchasePlusSale: number;
  sales: number;
  purchases: number;
  salesPurchasesRatio: number;
  firstPurchaseCostUAH: number;
  projectedProfit: number;
}

export function getProductMetrics(p: ProductUI, globalRate?: number): ProductMetrics {
  const totalCost = p.spent || 0;
  const totalPurchased = p.totalPurchased || 0;
  const totalSells = p.sellsCount || 0;

  let firstPurchaseCostUAH = 0;
  let firstSalePrice = p.priceInUA || 0;
  let projectedRevenue = 0;

  if (p.variantsList && p.variantsList.length > 0) {
    const included = p.variantsList.filter((v) => v.isIncluded !== false);
    if (included.length > 0) {
      const first = included[0];
      const rate = first.rateCNY || p.rateCNY || globalRate || 1;
      firstPurchaseCostUAH = (first.priceCNY || 0) * (rate > 0 ? rate : 1);
      firstSalePrice = first.priceInUA ?? p.priceInUA ?? 0;

      let calcRev = 0;
      for (const v of included) {
        const net =
          v.netPrice ??
          ((v.priceInUA || 0) > 0 ? (v.priceInUA || 0) * 0.97 - 30 : 0);
        calcRev += (Number(v.purchasedCount) || 0) * net;
      }
      projectedRevenue = calcRev;
    }
  } else {
    const rate = p.rateCNY || globalRate || 1;
    firstPurchaseCostUAH = (p.priceCNY || 0) * (rate > 0 ? rate : 1);
    const actualNetPrice =
      p.netPrice ||
      ((p.priceInUA || 0) > 0 ? (p.priceInUA || 0) * 0.97 - 30 : 0);
    projectedRevenue = totalPurchased * actualNetPrice;
  }

  const projectedProfit = projectedRevenue - totalCost;

  // ROI %: ((projectedRevenue / totalCost) - 1) * 100
  let roi = 0;
  if (totalCost > 0) {
    roi = (projectedRevenue / totalCost - 1) * 100;
  } else if (projectedRevenue > 0) {
    roi = 999999;
  }

  // Sale price
  const salePrice = firstSalePrice;

  // Purchase price + Sale price sum
  const purchasePlusSale = firstPurchaseCostUAH + salePrice;

  // Best sales count
  const sales = totalSells;

  // Large purchases count
  const purchases = totalPurchased;

  // Sales to purchases ratio (%)
  const salesPurchasesRatio =
    totalPurchased > 0 ? (totalSells / totalPurchased) * 100 : 0;

  return {
    salePrice,
    roi,
    purchasePlusSale,
    sales,
    purchases,
    salesPurchasesRatio,
    firstPurchaseCostUAH,
    projectedProfit,
  };
}

export function sortProducts(
  products: ProductUI[],
  sortBy: SortKey,
  sortDirection: SortDirection,
  globalRate?: number
): ProductUI[] {
  if (sortBy === "default") {
    return products;
  }

  return [...products].sort((a, b) => {
    const mA = getProductMetrics(a, globalRate);
    const mB = getProductMetrics(b, globalRate);

    let valA = 0;
    let valB = 0;

    switch (sortBy) {
      case "price_sale":
        valA = mA.salePrice;
        valB = mB.salePrice;
        break;
      case "roi":
        valA = mA.roi;
        valB = mB.roi;
        break;
      case "purchase_sale_sum":
        valA = mA.purchasePlusSale;
        valB = mB.purchasePlusSale;
        break;
      case "best_sales":
        valA = mA.sales;
        valB = mB.sales;
        break;
      case "large_purchases":
        valA = mA.purchases;
        valB = mB.purchases;
        break;
      case "sales_purchases_ratio":
        valA = mA.salesPurchasesRatio;
        valB = mB.salesPurchasesRatio;
        break;
    }

    if (valA === valB) {
      return 0;
    }

    return sortDirection === "asc"
      ? valA > valB
        ? 1
        : -1
      : valA < valB
      ? 1
      : -1;
  });
}
