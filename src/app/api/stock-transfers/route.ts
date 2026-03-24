import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const transfers = await prisma.stockTransfer.findMany({
            include: {
                fromLocation: true,
                toLocation: true,
                _count: {
                    select: { items: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(transfers)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { fromLocationId, toLocationId, referenceNo, items } = body

        if (!fromLocationId || !toLocationId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const transfer = await prisma.$transaction(async (tx) => {
            // 1. Create the transfer record
            const newTransfer = await tx.stockTransfer.create({
                data: {
                    fromLocationId,
                    toLocationId,
                    referenceNo,
                    status: 'COMPLETED', // Auto-complete for now
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity
                        }))
                    }
                }
            })

            // 2. Update LocationStock for each item
            for (const item of items) {
                // Update source location (decrement)
                await tx.locationStock.upsert({
                    where: {
                        productId_locationId: {
                            productId: item.productId,
                            locationId: fromLocationId
                        }
                    },
                    update: { quantity: { decrement: item.quantity } },
                    create: {
                        productId: item.productId,
                        locationId: fromLocationId,
                        quantity: -item.quantity
                    }
                })

                // Update destination location (increment)
                await tx.locationStock.upsert({
                    where: {
                        productId_locationId: {
                            productId: item.productId,
                            locationId: toLocationId
                        }
                    },
                    update: { quantity: { increment: item.quantity } },
                    create: {
                        productId: item.productId,
                        locationId: toLocationId,
                        quantity: item.quantity
                    }
                })
                
                // Note: We are NOT updating Product.stock here because transfers 
                // between locations don't change the TOTAL stock of the business.
            }

            return newTransfer
        })

        return NextResponse.json(transfer)
    } catch (error) {
        console.error('Transfer Error:', error)
        return NextResponse.json({ error: 'Failed to execute transfer' }, { status: 500 })
    }
}
