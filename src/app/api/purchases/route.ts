import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                supplier: { select: { name: true } },
                location: { select: { name: true } },
                items: {
                    include: { product: { select: { name: true } } }
                },
                _count: { select: { items: true } }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(purchases)
    } catch (error) {
        console.error('Purchases GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { supplierId, totalAmount, amountPaid = 0, paymentMethod = 'CASH', referenceNumber, items, locationId, status = 'RECEIVED' } = body
        
        let paymentStatus = 'PAID'
        if (amountPaid === 0) paymentStatus = 'DUE'
        else if (amountPaid < totalAmount) paymentStatus = 'PARTIAL'

        if (!supplierId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Use a transaction to create purchase and update stock
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    supplierId,
                    totalAmount,
                    amountPaid,
                    paymentStatus,
                    paymentMethod,
                    referenceNumber,
                    status,
                    locationId,
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitCost: item.unitCost
                        }))
                    }
                }
            })

            // 2. Update Product Stocks (Global and Location-specific) - ONLY IF RECEIVED
            if (status === 'RECEIVED') {
                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity
                            }
                        }
                    })

                    // 2.2 Optional: Update Global Selling Price
                    if (item.syncPrice && item.newPrice) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { price: item.newPrice }
                        })
                    }

                    if (locationId) {
                        await tx.locationStock.upsert({
                            where: {
                                productId_locationId: {
                                    productId: item.productId,
                                    locationId: locationId
                                }
                            },
                            update: {
                                quantity: {
                                    increment: item.quantity
                                }
                            },
                            create: {
                                productId: item.productId,
                                locationId: locationId,
                                quantity: item.quantity
                            }
                        })
                    }
                }
            }

            return purchase
        }, {
            timeout: 20000 // 20 seconds timeout for bulk procurement processing
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Purchase POST Error:', error)
        return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 })
    }
}
