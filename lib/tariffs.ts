/**
 * Global delivery tariffs from China (USD per kg)
 */
export const SHIPPING_RATES = {
  air: 18.5,
  sea: 7.3,
} as const;

export type ShippingType = keyof typeof SHIPPING_RATES | "custom";

/**
 * Returns the shipping rate in USD/kg based on the shipping type
 */
export function getShippingRatePerKg(
  shippingType?: string | null,
  customShippingRate?: number | null
): number {
  if (shippingType === "sea") {
    return SHIPPING_RATES.sea;
  }
  if (shippingType === "custom") {
    return customShippingRate || 0;
  }
  return SHIPPING_RATES.air;
}

