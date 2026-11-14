const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const variants = await prisma.variant.findMany();
  console.log('Total variants:', variants.length);

  let airCount = 0;
  let seaCount = 0;
  let customCount = 0;
  let otherCount = 0;

  for (const v of variants) {
    if (v.shippingType === 'air' || !v.shippingType) airCount++;
    else if (v.shippingType === 'sea') seaCount++;
    else if (v.shippingType === 'custom') customCount++;
    else otherCount++;
  }

  console.log({ airCount, seaCount, customCount, otherCount });

  // Let's check how many variants match exact formula:
  // (weight / 1000) * (purchasedCount || 1) * ratePerKgUSD * rateUSD
  let matchedAir = 0;
  let matchedSea = 0;
  let nullShipping = 0;

  for (const v of variants) {
    if (v.shippingUA == null) {
      nullShipping++;
      continue;
    }
    const rateUSD = v.rateUSD || 0;
    const weight = v.weight || 0;
    const count = (v.purchasedCount && v.purchasedCount > 0) ? v.purchasedCount : 1;
    
    // Check air
    const expectedAir = parseFloat((((weight / 1000) * count * 18.3) * rateUSD).toFixed(2));
    const expectedSea = parseFloat((((weight / 1000) * count * 7.1) * rateUSD).toFixed(2));

    const diffAir = Math.abs((v.shippingUA || 0) - expectedAir);
    const diffSea = Math.abs((v.shippingUA || 0) - expectedSea);

    if (diffAir < 0.1) matchedAir++;
    else if (diffSea < 0.1) matchedSea++;
    else {
      console.log(`Variant ${v.id} (${v.shippingType}): shippingUA=${v.shippingUA}, expectedAir=${expectedAir}, expectedSea=${expectedSea}, weight=${weight}, count=${v.purchasedCount}, rateUSD=${rateUSD}`);
    }
  }

  console.log({ matchedAir, matchedSea, nullShipping, remainingUnmatched: variants.length - matchedAir - matchedSea - nullShipping });
}

main().catch(console.error).finally(() => prisma.$disconnect());
