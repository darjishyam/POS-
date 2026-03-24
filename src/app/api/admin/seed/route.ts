import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST() {
    try {
        // 1. Create Locations
        const locations = await Promise.all([
            prisma.location.upsert({
                where: { name: 'MAIN WAREHOUSE ALPHA' },
                update: {},
                create: { name: 'MAIN WAREHOUSE ALPHA', type: 'WAREHOUSE', address: 'Industrial Sector 7, Block B' }
            }),
            prisma.location.upsert({
                where: { name: 'DOWNTOWN FLAGSHIP STORE' },
                update: {},
                create: { name: 'DOWNTOWN FLAGSHIP STORE', type: 'STORE', address: '452 Broadway, Manhattan, NY' }
            }),
            prisma.location.upsert({
                where: { name: 'UPTOWN EXPRESS HUB' },
                update: {},
                create: { name: 'UPTOWN EXPRESS HUB', type: 'STORE', address: '89-A Central Park West' }
            })
        ])

        // 2. Create Suppliers
        const suppliers = await Promise.all([
            prisma.supplier.create({
                data: { name: 'GLOBAL TECH SOLUTIONS', contactPerson: 'Hideo Kojima', email: 'logistics@globaltech.io', phone: '+1-555-9080', address: 'Tokyo R&D Center' }
            }),
            prisma.supplier.create({
                data: { name: 'FRESH HARVEST DISTRO', contactPerson: 'Sarah Miller', email: 'supply@freshharvest.com', phone: '+1-555-1234', address: 'Green Valley Farms' }
            })
        ]).catch(() => []) // Catch if unique constraints hit

        // 3. Create Categories
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
        const groups = await Promise.all([
            prisma.customerGroup.upsert({
                where: { name: 'VIP PLATINUM' },
                update: {},
                create: { name: 'VIP PLATINUM', discount: 15.0 }
            }),
            prisma.customerGroup.upsert({
                where: { name: 'WHOLESALE PARTNER' },
                update: {},
                create: { name: 'WHOLESALE PARTNER', discount: 25.0 }
            })
        ])

        // 6. Create Customers
        const customers = await Promise.all([
            prisma.customer.create({
                data: { name: 'BRUCE WAYNE', email: 'bruce@wayneent.com', phone: '+1-BAT-SIGNAL', customerGroupId: groups[0].id }
            }),
            prisma.customer.create({
                data: { name: 'SELINA KYLE', email: 'selina@cat.io', phone: '+1-999-0000', customerGroupId: groups[1].id }
            })
        ]).catch(() => [])

        // 7. Initialize LocationStock
        for (const loc of locations) {
            for (const prod of products) {
                await prisma.locationStock.upsert({
                    where: { productId_locationId: { productId: prod.id, locationId: loc.id } },
                    update: {},
                    create: { productId: prod.id, locationId: loc.id, quantity: Math.floor(Math.random() * 10) + 5 }
                })
            }
        }

        return NextResponse.json({ message: 'Logistics Matrix Successfully Populated' })
    } catch (error) {
        console.error('Seeding Error:', error)
        return NextResponse.json({ error: 'Data injection failed' }, { status: 500 })
    }
}
