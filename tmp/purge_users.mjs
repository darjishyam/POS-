import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emailsToDelete = [
    'patelhemit321@gmail.com',
    '24034211019@gnu.ac.in'
  ];

  for (const email of emailsToDelete) {
    try {
      const deleted = await prisma.user.delete({ where: { email } });
      console.log(`Successfully purged ${email}`);
    } catch (e) {
      console.log(`Could not find or delete ${email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
