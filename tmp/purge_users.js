const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const emailsToDelete = [
    'patelhemit321@gmail.com', // Hemit
    '24034211019@gnu.ac.in'    // 24034
  ];

  for (const email of emailsToDelete) {
    try {
      await prisma.user.delete({ where: { email } });
      console.log(`Successfully purged ${email} from Personnel Matrix.`);
    } catch (e) {
      console.log(`Failed to purge ${email} (might not exist): ${e.message}`);
    }
  }
}

main().finally(() => prisma.$disconnect());
