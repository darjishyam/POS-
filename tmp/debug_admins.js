
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugAdminEmails() {
  try {
    console.log('--- Admin Query Debug (checkout logic) ---');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, role: true }
    });

    console.log(`Found ${admins.length} admins.`);
    admins.forEach(a => {
      console.log(`- Email: "${a.email}", Role: "${a.role}"`);
    });

    // Also check the specific product's current stock
    const product = await prisma.product.findFirst({
        where: { name: { contains: 'VRP-12' } }
    });
    if (product) {
        console.log(`\nProduct: ${product.name}`);
        console.log(`Stock: ${product.stock}, Alert: ${product.alertQuantity}, Manage: ${product.manageStock}`);
        console.log(`Threshold Hit: ${product.manageStock && product.stock <= product.alertQuantity}`);
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminEmails();
