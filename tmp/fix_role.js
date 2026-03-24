const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.update({
    where: { email: 'shyamdarji1604@gmail.com' },
    data: { role: 'ADMIN' },
  })
  console.log('Update successful:', user.email, user.role)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
