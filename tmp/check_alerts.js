
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStockAlerts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        stock: 10
      }
    });

    console.log('--- Product Stock Check (stock = 10) ---');
    products.forEach(p => {
      console.log(`Product: ${p.id} - ${p.name}`);
      console.log(`  Stock: ${p.stock}`);
      console.log(`  Alert Quantity: ${p.alertQuantity}`);
      console.log(`  Manage Stock: ${p.manageStock}`);
      console.log(`  Condition (stock <= alertQuantity): ${p.stock <= p.alertQuantity}`);
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });

    console.log('\n--- Admin Users ---');
    admins.forEach(a => {
      console.log(`Admin: ${a.email} (${a.name})`);
    });

    if (admins.length === 0) {
      console.log('ALERT: No ADMIN users found in the database!');
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkStockAlerts();
