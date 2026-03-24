import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId, reason, items } = body // items: { productId, quantity, price }[]

        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing return parameters' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Verify Original Order
            const originalOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            })

            if (!originalOrder) throw new Error('Original transaction not found')

            // 2. Create the SalesReturn record
            const totalRefund = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
            
            const salesReturn = await tx.salesReturn.create({
                data: {
                    orderId,
                    reason: reason || 'Standard Return',
                    totalRefund,
                    status: 'COMPLETED',
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })

            // 3. Re-increment Inventory Stock (Phase 3: Inventory Restoration)
            const defaultLocation = await tx.location.findFirst({
                where: { type: 'STORE' }
            })

            for (const item of items) {
                // Global Product Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } }
                })

                // Location-specific Stock
                if (defaultLocation) {
                    await tx.locationStock.upsert({
                        where: {
                            productId_locationId: {
                                productId: item.productId,
                                locationId: defaultLocation.id
                            }
                        },
                        update: { quantity: { increment: item.quantity } },
                        create: {
                            productId: item.productId,
                            locationId: defaultLocation.id,
                            quantity: item.quantity
                        }
                    })
                }
            }

            // 4. Update Order Status (Optional: Mark as Return Initiated)
            await tx.order.update({
                where: { id: orderId },
                data: { status: 'RETURNED' }
            })

            return salesReturn
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Return Error:', error)
        return NextResponse.json({ error: error.message || 'Reverse logistics protocol failure' }, { status: 500 })
    }
}
