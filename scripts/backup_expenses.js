const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  try {
    const expenses = await prisma.expense.findMany();
    fs.writeFileSync('temp_expenses.json', JSON.stringify(expenses, null, 2));
    console.log(`Successfully backed up ${expenses.length} expenses.`);
  } catch (e) {
    console.error('Backup failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
