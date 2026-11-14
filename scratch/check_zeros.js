const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const zeroPurchased = await prisma.variant.findMany({
    where: {
      OR: [
        { purchasedCount: null },
        { purchasedCount: 0 },
        { purchasedCount: { lt: 0 } },
      ],
    },
  });
  console.log('Zero or null purchasedCount variants:', zeroPurchased.length);
  if (zeroPurchased.length > 0) {
    console.log(zeroPurchased.map(v => ({ id: v.id, purchasedCount: v.purchasedCount, shippingUA: v.shippingUA, weight: v.weight, rateUSD: v.rateUSD })));
  }

  const zeroWeight = await prisma.variant.findMany({
    where: {
      OR: [
        { weight: null },
        { weight: 0 },
      ],
    },
  });
  console.log('Zero or null weight variants:', zeroWeight.length);

  const zeroRateUSD = await prisma.variant.findMany({
    where: {
      OR: [
        { rateUSD: null },
        { rateUSD: 0 },
      ],
    },
  });
  console.log('Zero or null rateUSD variants:', zeroRateUSD.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
