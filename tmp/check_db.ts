import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const customers = await prisma.customer.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { orders: true } } }
  })
  console.log('Recent Customers:', JSON.stringify(customers, null, 2))
  
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { customer: true }
  })
  console.log('Recent Orders:', JSON.stringify(orders, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
