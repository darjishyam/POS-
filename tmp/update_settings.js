
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.setting.findUnique({ where: { id: 'system' } });
  console.log('Current Settings:', settings);
  
  const updated = await prisma.setting.upsert({
    where: { id: 'system' },
    update: {
      currency: 'INR',
      currencySymbol: '₹'
    },
    create: {
      id: 'system',
      currency: 'INR',
      currencySymbol: '₹',
      storeName: 'BardPOS'
    }
  });
  console.log('Updated Settings:', updated);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
