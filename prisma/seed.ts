import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('--- STARTING COMPREHENSIVE DATA SEEDING ---')

    // 1. Create Locations
    const locations = await Promise.all([
        (prisma as any).location.upsert({
            where: { name: 'MAIN WAREHOUSE ALPHA' },
            create: { name: 'MAIN WAREHOUSE ALPHA', type: 'WAREHOUSE', address: 'Industrial Sector 7, Block B' },
            update: {}
        }),
        (prisma as any).location.upsert({
            where: { name: 'DOWNTOWN FLAGSHIP' },
            create: { name: 'DOWNTOWN FLAGSHIP', type: 'STORE', address: '452 Broadway, Manhattan, NY' },
            update: {}
        })
    ])

    // 2. Create Brands
    const brands = await Promise.all([
        prisma.brand.upsert({ where: { name: 'Apple' }, create: { name: 'Apple' }, update: {} }),
        prisma.brand.upsert({ where: { name: 'Samsung' }, create: { name: 'Samsung' }, update: {} }),
        prisma.brand.upsert({ where: { name: 'Sony' }, create: { name: 'Sony' }, update: {} }),
        prisma.brand.upsert({ where: { name: 'Nike' }, create: { name: 'Nike' }, update: {} }),
        prisma.brand.upsert({ where: { name: 'Dell' }, create: { name: 'Dell' }, update: {} }),
        prisma.brand.upsert({ where: { name: 'Adidas' }, create: { name: 'Adidas' }, update: {} })
    ])

    // 3. Create Categories
    const categories = await Promise.all([
        prisma.category.upsert({ where: { name: 'Smartphones' }, create: { name: 'Smartphones', icon: 'Smartphone' }, update: {} }),
        prisma.category.upsert({ where: { name: 'Laptops' }, create: { name: 'Laptops', icon: 'Laptop' }, update: {} }),
        prisma.category.upsert({ where: { name: 'Audio' }, create: { name: 'Audio', icon: 'Headphones' }, update: {} }),
        prisma.category.upsert({ where: { name: 'Footwear' }, create: { name: 'Footwear', icon: 'Footprints' }, update: {} }),
        prisma.category.upsert({ where: { name: 'Apparel' }, create: { name: 'Apparel', icon: 'Shirt' }, update: {} })
    ])

    // 4. Create Units
    const units = await Promise.all([
        prisma.unit.upsert({ where: { name: 'Piece' }, create: { name: 'Piece' }, update: {} }),
        prisma.unit.upsert({ where: { name: 'Pair' }, create: { name: 'Pair' }, update: {} })
    ])

    // 5. Large Product Set
    const productData = [
        { name: 'iPhone 15 Pro', price: 999, sku: 'IPH-15P', stock: 50, brand: 'Apple', cat: 'Smartphones', image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&q=80&w=200' },
        { name: 'Samsung S24 Ultra', price: 1299, sku: 'SAM-S24U', stock: 40, brand: 'Samsung', cat: 'Smartphones', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=200' },
        { name: 'Sony WH-1000XM5', price: 399, sku: 'SONY-XM5', stock: 30, brand: 'Sony', cat: 'Audio', image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&q=80&w=200' },
        { name: 'MacBook Air M3', price: 1099, sku: 'MAC-AIR-M3', stock: 20, brand: 'Apple', cat: 'Laptops', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=200' },
        { name: 'Dell XPS 15', price: 2100, sku: 'DELL-XPS15', stock: 10, brand: 'Dell', cat: 'Laptops', image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=200' },
        { name: 'Nike Air Max 270', price: 150, sku: 'NIKE-AM270', stock: 60, brand: 'Nike', cat: 'Footwear', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200' },
        { name: 'Adidas Ultraboost', price: 180, sku: 'ADI-UB-01', stock: 55, brand: 'Adidas', cat: 'Footwear', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&q=80&w=200' },
        { name: 'Samsung Galaxy Buds 2', price: 149, sku: 'SAM-GB2', stock: 100, brand: 'Samsung', cat: 'Audio', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=200' },
        { name: 'Apple Watch Series 9', price: 399, sku: 'APL-W9', stock: 25, brand: 'Apple', cat: 'Smartphones', image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=200' },
        { name: 'Nike Tech Fleece', price: 120, sku: 'NIKE-TF-JG', stock: 35, brand: 'Nike', cat: 'Apparel', image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=200' }
    ]

    for (const p of productData) {
        const brandId = brands.find(b => b.name === p.brand)?.id
        const categoryId = categories.find(c => c.name === p.cat)?.id
        
        const product = await prisma.product.upsert({
            where: { sku: p.sku },
            update: { stock: p.stock, image: p.image },
            create: {
                name: p.name,
                price: p.price,
                sku: p.sku,
                stock: p.stock,
                image: p.image,
                brandId,
                categoryId,
                unitId: units[0].id
            }
        })

        // Add initial stock to locations
        for (const loc of locations) {
            await (prisma as any).locationStock.upsert({
                where: { productId_locationId: { productId: product.id, locationId: loc.id } },
                create: { productId: product.id, locationId: loc.id, quantity: Math.floor(p.stock / 2) },
                update: {}
            })
        }
    }

    console.log('--- DATABASE SEEDED SUCCESSFULLY WITH 10+ PRODUCTS ---')
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(async () => { await prisma.$disconnect() })

