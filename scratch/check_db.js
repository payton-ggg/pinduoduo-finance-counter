const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    include: {
      variants: true
    }
  });
  console.log("Found products count:", products.length);
  for (const p of products) {
    console.log(`Product: ${p.name}`);
    for (const v of p.variants) {
      console.log(`  Variant: ${v.pddSearchQuery || 'Unnamed'}, Weight: ${v.weight}, PurchasedCount: ${v.purchasedCount}`);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
