export type ExchangeRates = { cny: number; usd: number; eur: number };

export async function getExchangeRates(): Promise<ExchangeRates> {
  const rates: ExchangeRates = { cny: 1, usd: 1, eur: 1 };
  try {
    const monoRes = await fetch("https://api.monobank.ua/bank/currency", {
      next: { revalidate: 3600 }
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

      if (usdEntry || cnyEntry || eurEntry) return rates;
    }
  } catch (e) {
    console.error("Failed to fetch Monobank rates, falling back to NBU", e);
  }

  try {
    const [cnyRes, usdRes, eurRes] = await Promise.all([
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json", { next: { revalidate: 3600 } }),
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json", { next: { revalidate: 3600 } }),
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json", { next: { revalidate: 3600 } })
    ]);

    const [cnyData, usdData, eurData] = await Promise.all([cnyRes.json(), usdRes.json(), eurRes.json()]);

    if (cnyData && cnyData.length > 0) {
      rates.cny = cnyData[0].rate * 1.02;
    }
    if (usdData && usdData.length > 0) {
      rates.usd = usdData[0].rate * 1.02;
    }
    if (eurData && eurData.length > 0) {
      rates.eur = eurData[0].rate * 1.02;
    }
  } catch (e) {
    console.error("Failed to fetch NBU exchange rates", e);
  }
  return rates;
}
