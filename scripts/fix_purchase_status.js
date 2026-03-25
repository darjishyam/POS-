const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const purchases = await prisma.purchase.findMany()
  console.log(`Checking ${purchases.length} purchases...`)
  
  for (const purchase of purchases) {
    const total = purchase.totalAmount
    const paid = purchase.amountPaid || 0
    let newStatus = 'PAID'
    if (paid === 0) newStatus = 'DUE'
    else if (paid < total) newStatus = 'PARTIAL'
    
    if (purchase.paymentStatus !== newStatus) {
      console.log(`Updating Purchase ${purchase.id}: ${purchase.paymentStatus} -> ${newStatus}`)
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { paymentStatus: newStatus }
      })
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
