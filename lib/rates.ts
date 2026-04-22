export async function getExchangeRates() {
  const rates = { cny: 1, usd: 1 };
  try {
    const [cnyRes, usdRes] = await Promise.all([
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=CNY&json", { next: { revalidate: 3600 } }),
      fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json", { next: { revalidate: 3600 } })
    ]);

    const [cnyData, usdData] = await Promise.all([cnyRes.json(), usdRes.json()]);

    if (cnyData && cnyData.length > 0) rates.cny = cnyData[0].rate;
    if (usdData && usdData.length > 0) rates.usd = usdData[0].rate;
  } catch (e) {
    console.error("Failed to fetch exchange rates", e);
  }
  return rates;
}
