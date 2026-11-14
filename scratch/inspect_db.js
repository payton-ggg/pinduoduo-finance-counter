const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.variant.count();
  console.log('Total variants:', count);

  const shippingTypes = await prisma.variant.groupBy({
    by: ['shippingType'],
    _count: {
      id: true,
    },
  });
  console.log('Shipping types breakdown:', shippingTypes);

  // Sample some variants
  const samples = await prisma.variant.findMany({
    take: 10,
    select: {
      id: true,
      productId: true,
      weight: true,
      purchasedCount: true,
      rateUSD: true,
      shippingUA: true,
      shippingType: true,
      customShippingRate: true,
    },
  });
  console.log('Sample variants:', samples);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
