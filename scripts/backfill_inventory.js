const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING INVENTORY BACKFILL ---');

  // 1. Create Default Brand
  const defaultBrand = await prisma.brand.upsert({
    where: { name: 'Standard Brand' },
    update: {},
    create: {
      name: 'Standard Brand',
      description: 'System-generated default brand for legacy products.',
      status: true
    }
  });
  console.log(`- Brand Ready: ${defaultBrand.name} (ID: ${defaultBrand.id})`);

  // 2. Create Default Unit
  const defaultUnit = await prisma.unit.upsert({
    where: { name: 'Piece' },
    update: {},
    create: {
      name: 'Piece',
      description: 'Standard unit of measurement.',
      status: true
    }
  });
  console.log(`- Unit Ready: ${defaultUnit.name} (ID: ${defaultUnit.id})`);

  // 3. Update Existing Products
  const result = await prisma.product.updateMany({
    where: {
      OR: [
        { brandId: null },
        { unitId: null }
      ]
    },
    data: {
      brandId: defaultBrand.id,
      unitId: defaultUnit.id
    }
  });

  console.log(`- Success: Synchronized ${result.count} products to the new registry.`);
  console.log('--- BACKFILL COMPLETE ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
