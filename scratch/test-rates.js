import { getExchangeRates } from "../lib/rates.js";

async function test() {
  console.log("Fetching exchange rates...");
  const start = Date.now();
  try {
    const rates = await getExchangeRates();
    console.log("Rates fetched successfully:", rates);
  } catch (e) {
    console.error("Error fetching rates:", e);
  }
  console.log(`Time taken: ${(Date.now() - start) / 1000}s`);
}

test();
