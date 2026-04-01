import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productSchema } from '@/lib/validations'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const sku = searchParams.get('sku')

        if (sku) {
            const product = await prisma.product.findUnique({
                where: { sku },
                include: { category: true }
            })
            return NextResponse.json(product)
        }

        const products = await prisma.product.findMany({
            include: { category: true },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(products)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // Industrial Schema Validation
        const validation = productSchema.safeParse(body)
        if (!validation.success) {
            console.error('POST Validation Error:', validation.error.format())
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const { supplierId, purchaseCost, ...productInfo } = validation.data

        let product;

        // Perform transactional creation if Quick Buy protocol is engaged
        if (supplierId && purchaseCost !== undefined && purchaseCost !== null && productInfo.stock > 0) {
            product = await prisma.$transaction(async (tx: any) => {
                // 1. Core Asset Creation
                const newProduct = await tx.product.create({
                    data: productInfo
                });

                // 2. Initializing Vendor Purchase Order (UNPAID)
                const totalAmount = purchaseCost * productInfo.stock;
                await tx.purchase.create({
                    data: {
                        supplierId: supplierId,
                        totalAmount: totalAmount,
                        amountPaid: 0,
                        paymentStatus: "UNPAID",
                        status: "RECEIVED",
                        items: {
                            create: [{
                                productId: newProduct.id,
                                quantity: productInfo.stock,
                                unitCost: purchaseCost
                            }]
                        }
                    }
                });

                return newProduct;
            });
        } else {
            // Standard Isolated Creation
            product = await prisma.product.create({
                data: productInfo
            })
        }

        return NextResponse.json(product)
    } catch (error: any) {
        console.error('Prisma Error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'SKU already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
    }
}
