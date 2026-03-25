const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');

async function main() {
  console.log('--- STARTING EXPENSE RESTORATION ---');
  
  if (!fs.existsSync('temp_expenses.json')) {
    console.log('No backup file found. Skipping restoration.');
    return;
  }

  const backupData = JSON.parse(fs.readFileSync('temp_expenses.json', 'utf8'));
  console.log(`Found ${backupData.length} records to restore.`);

  for (const oldExp of backupData) {
    // 1. Ensure category exists
    const category = await prisma.expenseCategory.upsert({
      where: { name: oldExp.category || 'Other' },
      update: {},
      create: { 
        name: oldExp.category || 'Other',
        description: 'Migrated from legacy system'
      }
    });

    // 2. Re-create expense
    await prisma.expense.create({
      data: {
        amount: oldExp.amount,
        description: oldExp.description,
        date: new Date(oldExp.date),
        categoryId: category.id,
        createdAt: new Date(oldExp.createdAt),
        updatedAt: new Date(oldExp.updatedAt)
      }
    });
    console.log(`- Restored: ${oldExp.description} (${category.name})`);
  }

  console.log('--- RESTORATION COMPLETE ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
