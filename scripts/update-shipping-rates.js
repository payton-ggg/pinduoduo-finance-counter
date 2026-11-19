const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1]) {
    const val = parseFloat(args[index + 1]);
    if (!isNaN(val)) return val;
  }
  return null;
}

const NEW_RATES = {
  air: getArgValue('--air') ?? 18.5,
  sea: getArgValue('--sea') ?? 7.3,
};

async function updateShippingRates(dryRun = false) {
  console.log(`Starting shipping rate update... (Mode: ${dryRun ? 'DRY-RUN' : 'LIVE'})`);
  console.log(`Tariffs: Air = $${NEW_RATES.air}/kg, Sea = $${NEW_RATES.sea}/kg\n`);

  const variants = await prisma.variant.findMany({
    include: {
      product: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  console.log(`Found ${variants.length} variants to process.`);

  let updatedCount = 0;
  let skippedCount = 0;
  let totalOldShippingUA = 0;
  let totalNewShippingUA = 0;

  const changes = [];

  for (const variant of variants) {
    const shippingType = variant.shippingType || 'air';

    let ratePerKgUSD = 0;
    if (shippingType === 'sea') {
      ratePerKgUSD = NEW_RATES.sea;
    } else if (shippingType === 'custom') {
      ratePerKgUSD = variant.customShippingRate || 0;
    } else {
      ratePerKgUSD = NEW_RATES.air;
    }

    if (shippingType === 'custom') {
      console.log(`Skipping custom variant ${variant.id} (${variant.product?.name || 'Unnamed'})`);
      skippedCount++;
      continue;
    }

    const weight = Number(variant.weight) || 0;
    const purchasedCount = Number(variant.purchasedCount) || 0;
    const rateUSD = Number(variant.rateUSD) || 0;

    if (weight <= 0 || purchasedCount <= 0 || rateUSD <= 0) {
      console.log(`Skipping variant ${variant.id} due to missing data: weight=${weight}, purchased=${purchasedCount}, rateUSD=${rateUSD}`);
      skippedCount++;
      continue;
    }

    const shippingCostUSD = (weight / 1000) * purchasedCount * ratePerKgUSD;
    const newShippingUA = parseFloat((shippingCostUSD * rateUSD).toFixed(2));
    const oldShippingUA = variant.shippingUA != null ? parseFloat(variant.shippingUA.toFixed(2)) : 0;

    totalOldShippingUA += oldShippingUA;
    totalNewShippingUA += newShippingUA;

    changes.push({
      id: variant.id,
      productName: variant.product?.name,
      shippingType,
      weight,
      purchasedCount,
      rateUSD,
      oldShippingUA,
      newShippingUA,
      diff: parseFloat((newShippingUA - oldShippingUA).toFixed(2)),
    });

    if (!dryRun) {
      await prisma.variant.update({
        where: { id: variant.id },
        data: { shippingUA: newShippingUA },
      });
    }

    updatedCount++;
  }

  console.log('\n--- Summary of Changes ---');
  console.table(
    changes.slice(0, 15).map(c => ({
      Product: c.productName?.slice(0, 25),
      Type: c.shippingType,
      'Weight (g)': c.weight,
      Qty: c.purchasedCount,
      RateUSD: c.rateUSD,
      'Old UAH': c.oldShippingUA,
      'New UAH': c.newShippingUA,
      'Diff UAH': c.diff,
    }))
  );
  if (changes.length > 15) {
    console.log(`... and ${changes.length - 15} more variants.`);
  }

  console.log(`\nTotal processed: ${variants.length}`);
  console.log(`Updated: ${updatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total shipping sum before: ${totalOldShippingUA.toFixed(2)} UAH`);
  console.log(`Total shipping sum after:  ${totalNewShippingUA.toFixed(2)} UAH`);
  console.log(`Net difference:            +${(totalNewShippingUA - totalOldShippingUA).toFixed(2)} UAH`);

  return changes;
}

updateShippingRates(isDryRun)
  .catch((err) => {
    console.error('Error updating shipping rates:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
