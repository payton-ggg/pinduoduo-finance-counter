export async function getExchangeRates() {
  const rates = { cny: 1, usd: 1 };
  try {
    // Try Monobank first for commercial rates
    const monoRes = await fetch("https://api.monobank.ua/bank/currency", { 
      next: { revalidate: 3600 } 
    });
    
    if (monoRes.ok) {
      const monoData = await monoRes.json();
      // USD is 840, UAH is 980
      const usdEntry = monoData.find(
        (item: any) => item.currencyCodeA === 840 && item.currencyCodeB === 980
      );
      // CNY is 156, UAH is 980
      const cnyEntry = monoData.find(
        (item: any) => item.currencyCodeA === 156 && item.currencyCodeB === 980
      );

      if (usdEntry) {
        // Use rateSell as it's the "unfavorable" rate (bank sells to you)
        rates.usd = usdEntry.rateSell || usdEntry.rateCross;
      }
      if (cnyEntry) {
        rates.cny = cnyEntry.rateSell || cnyEntry.rateCross;
      }
      
      // If we got at least one rate, return them
      if (usdEntry || cnyEntry) return rates;
    }
  } catch (e) {
    console.error("Failed to fetch Monobank rates, falling back to NBU", e);
  }

  // Fallback to NBU
  try {
    const [cnyRes, usdRes] = await Promise.all([
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json", { next: { revalidate: 3600 } }),
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json", { next: { revalidate: 3600 } })
    ]);

    const [cnyData, usdData] = await Promise.all([cnyRes.json(), usdRes.json()]);

    if (cnyData && cnyData.length > 0) {
      // NBU is official rate, usually lower than commercial. 
      // Adding a small margin (e.g. 2%) to simulate "unfavorable" rate if NBU is used as fallback?
      // Or just use the rate. The user specifically asked for "the higher one".
      rates.cny = cnyData[0].rate * 1.02; 
    }
    if (usdData && usdData.length > 0) {
      rates.usd = usdData[0].rate * 1.02;
    }
  } catch (e) {
    console.error("Failed to fetch NBU exchange rates", e);
  }
  return rates;
}
