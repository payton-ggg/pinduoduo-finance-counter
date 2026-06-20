export type ExchangeRates = { cny: number; usd: number; eur: number };

// Global cache variable to survive hot-reloads and persist between requests in Node.js
const globalForRates = global as unknown as {
  cachedRates?: ExchangeRates;
  lastFetchTime?: number;
};

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Default/fallback rates in case APIs are completely unreachable or timeout
const FALLBACK_RATES: ExchangeRates = {
  cny: 6.8,  // Approximate CNY/UAH rate
  usd: 41.5, // Approximate USD/UAH rate
  eur: 45.0, // Approximate EUR/UAH rate
};

export async function getExchangeRates(): Promise<ExchangeRates> {
  const now = Date.now();
  
  // Use cached rates if available and fresh (less than 1 hour old)
  if (globalForRates.cachedRates && globalForRates.lastFetchTime && (now - globalForRates.lastFetchTime < CACHE_DURATION_MS)) {
    return globalForRates.cachedRates;
  }

  const rates: ExchangeRates = { ...(globalForRates.cachedRates || FALLBACK_RATES) };
  let success = false;

  // 1. Try Monobank API with a short timeout
  try {
    const monoRes = await fetch("https://api.monobank.ua/bank/currency", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(1500), // 1.5 seconds timeout
    });

    if (monoRes.ok) {
      const monoData = await monoRes.json();
      const usdEntry = monoData.find(
        (item: any) => item.currencyCodeA === 840 && item.currencyCodeB === 980
      );
      const cnyEntry = monoData.find(
        (item: any) => item.currencyCodeA === 156 && item.currencyCodeB === 980
      );
      const eurEntry = monoData.find(
        (item: any) => item.currencyCodeA === 978 && item.currencyCodeB === 980
      );

      if (usdEntry) {
        rates.usd = usdEntry.rateSell || usdEntry.rateCross;
      }
      if (cnyEntry) {
        rates.cny = cnyEntry.rateSell || cnyEntry.rateCross;
      }
      if (eurEntry) {
        rates.eur = eurEntry.rateSell || eurEntry.rateCross;
      }

      if (usdEntry || cnyEntry || eurEntry) {
        success = true;
      }
    }
  } catch (e) {
    console.error("Failed to fetch Monobank rates, falling back to NBU", e);
  }

  // 2. If Monobank failed/timed out, try NBU API with a short timeout
  if (!success) {
    try {
      const [cnyRes, usdRes, eurRes] = await Promise.all([
        fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json", {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(1500),
        }),
        fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json", {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(1500),
        }),
        fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json", {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(1500),
        }),
      ]);

      const [cnyData, usdData, eurData] = await Promise.all([
        cnyRes.json(),
        usdRes.json(),
        eurRes.json(),
      ]);

      if (cnyData && cnyData.length > 0) {
        rates.cny = cnyData[0].rate * 1.02;
      }
      if (usdData && usdData.length > 0) {
        rates.usd = usdData[0].rate * 1.02;
      }
      if (eurData && eurData.length > 0) {
        rates.eur = eurData[0].rate * 1.02;
      }
      success = true;
    } catch (e) {
      console.error("Failed to fetch NBU exchange rates", e);
    }
  }

  // Update global cache if the fetch was successful, or if we don't have any cached rates yet
  if (success || !globalForRates.cachedRates) {
    globalForRates.cachedRates = rates;
    globalForRates.lastFetchTime = now;
  }

  return globalForRates.cachedRates;
}

