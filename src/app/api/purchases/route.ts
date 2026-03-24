import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                supplier: { select: { name: true } },
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
        const { supplierId, totalAmount, referenceNumber, items, locationId } = body

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
                    referenceNumber,
                    status: 'RECEIVED',
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            unitCost: item.unitCost
                        }))
                    }
                }
            })

            // 2. Update Product Stocks (Global and Location-specific)
            for (const item of items) {
                // global
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                })

                // location-specific
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

            return purchase
        })

        return NextResponse.json(result)
    } catch (error) {
        console.error('Purchase POST Error:', error)
        return NextResponse.json({ error: 'Failed to process purchase' }, { status: 500 })
    }
}
