import { getExchangeRates } from "../lib/rates";
import { prisma } from "../lib/prisma";

async function test() {
  console.log("1. Fetching exchange rates (First run)...");
  let start = Date.now();
  try {
    const rates = await getExchangeRates();
    console.log("Rates fetched successfully:", rates);
  } catch (e) {
    console.error("Error fetching rates:", e);
  }
  console.log(`First run time taken: ${(Date.now() - start) / 1000}s\n`);

  console.log("2. Fetching exchange rates (Second run - should be cached)...");
  start = Date.now();
  try {
    const rates = await getExchangeRates();
    console.log("Rates fetched successfully (cached):", rates);
  } catch (e) {
    console.error("Error fetching cached rates:", e);
  }
  console.log(`Second run time taken: ${(Date.now() - start) / 1000}s\n`);

  console.log("3. Querying database...");
  start = Date.now();
  try {
    const count = await prisma.product.count();
    console.log(`Total products in DB: ${count}`);
  } catch (e) {
    console.error("Error querying DB:", e);
  }
  console.log(`DB query time taken: ${(Date.now() - start) / 1000}s\n`);
  
  await prisma.$disconnect();
}

test();
