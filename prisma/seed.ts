import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- INITIALIZING CORE DATA MAPPING ---')

    // 1. Create Locations
    console.log('Defining Site Architecture...')
    const locations = await Promise.all([
        (prisma as any).location.upsert({
            where: { name: 'MAIN WAREHOUSE ALPHA' },
            update: {},
            create: { name: 'MAIN WAREHOUSE ALPHA', type: 'WAREHOUSE', address: 'Industrial Sector 7, Block B' }
        }),
        (prisma as any).location.upsert({
            where: { name: 'DOWNTOWN FLAGSHIP STORE' },
            update: {},
            create: { name: 'DOWNTOWN FLAGSHIP STORE', type: 'STORE', address: '452 Broadway, Manhattan, NY' }
        }),
        (prisma as any).location.upsert({
            where: { name: 'UPTOWN EXPRESS HUB' },
            update: {},
            create: { name: 'UPTOWN EXPRESS HUB', type: 'STORE', address: '89-A Central Park West' }
        })
    ])

    // 2. Create Suppliers
    console.log('Registering Vendor Entities...')
    const suppliers = await Promise.all([
        (prisma as any).supplier.upsert({
            where: { email: 'logistics@globaltech.io' },
            update: {},
            create: { name: 'GLOBAL TECH SOLUTIONS', contactPerson: 'Hideo Kojima', email: 'logistics@globaltech.io', phone: '+1-555-9080', address: 'Tokyo R&D Center' }
        }),
        (prisma as any).supplier.upsert({
            where: { email: 'supply@freshharvest.com' },
            update: {},
            create: { name: 'FRESH HARVEST DISTRO', contactPerson: 'Sarah Miller', email: 'supply@freshharvest.com', phone: '+1-555-1234', address: 'Green Valley Farms' }
        })
    ])

    // 3. Create Categories
    console.log('Calibrating Classifications...')
    const categories = await Promise.all([
        prisma.category.upsert({
            where: { name: 'HIGH-END ELECTRONICS' },
            update: {},
            create: { name: 'HIGH-END ELECTRONICS', description: 'Computing and Mobile Assets' }
        }),
        prisma.category.upsert({
            where: { name: 'EXECUTIVE APPAREL' },
            update: {},
            create: { name: 'EXECUTIVE APPAREL', description: 'Modern Professional Wear' }
        })
    ])

    // 4. Create Products
    console.log('Ingesting Product Matrix...')
    const products = await Promise.all([
        prisma.product.upsert({
            where: { sku: 'MAC-M3-001' },
            update: {},
            create: { name: 'MACBOOK PRO M3 MAX', price: 3499.00, sku: 'MAC-M3-001', stock: 15, categoryId: categories[0].id }
        }),
        prisma.product.upsert({
            where: { sku: 'IPH-15-TIT' },
            update: {},
            create: { name: 'IPHONE 15 PRO TITANIUM', price: 1199.00, sku: 'IPH-15-TIT', stock: 45, categoryId: categories[0].id }
        }),
        prisma.product.upsert({
            where: { sku: 'SUIT-EXE-BL' },
            update: {},
            create: { name: 'ULTIMATE EXECUTIVE SUIT', price: 850.00, sku: 'SUIT-EXE-BL', stock: 20, categoryId: categories[1].id }
        })
    ])

    // 5. Create Customer Groups
    console.log('Defining Privilege Tiers...')
    const groups = await Promise.all([
        (prisma as any).customerGroup.upsert({
            where: { name: 'VIP PLATINUM' },
            update: {},
            create: { name: 'VIP PLATINUM', discount: 15.0 }
        }),
        (prisma as any).customerGroup.upsert({
            where: { name: 'WHOLESALE PARTNER' },
            update: {},
            create: { name: 'WHOLESALE PARTNER', discount: 25.0 }
        })
    ])

    // 6. Create Customers
    console.log('Mapping Client Portfolio...')
    await Promise.all([
        (prisma as any).customer.upsert({
            where: { email: 'bruce@wayneent.com' },
            update: {},
            create: { name: 'BRUCE WAYNE', email: 'bruce@wayneent.com', phone: '+1-BAT-SIGNAL', customerGroupId: groups[0].id }
        }),
        (prisma as any).customer.upsert({
            where: { email: 'selina@cat.io' },
            update: {},
            create: { name: 'SELINA KYLE', email: 'selina@cat.io', phone: '+1-999-0000', customerGroupId: groups[1].id }
        })
    ])

    // 7. Initialize LocationStock
    console.log('Allocating Initial Stock Flow...')
    for (const loc of locations) {
        for (const prod of products) {
            await (prisma as any).locationStock.upsert({
                where: { productId_locationId: { productId: prod.id, locationId: loc.id } },
                update: {},
                create: { productId: prod.id, locationId: loc.id, quantity: Math.floor(Math.random() * 20) + 10 }
            })
        }
    }

    console.log('--- LOGISTICS MATRIX INITIALIZED SUCCESSFULLY ---')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
