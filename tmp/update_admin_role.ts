import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('Updating role for admin user...')
    const user = await prisma.user.update({
        where: { email: 'professorshyam123@gmail.com' },
        data: { role: 'ADMIN' }
    })
    console.log('User role updated successfully:', {
        name: user.name,
        email: user.email,
        role: user.role
    })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error updating user role:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
