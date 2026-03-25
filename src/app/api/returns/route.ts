import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const returns = await prisma.salesReturn.findMany({
            include: {
                order: {
                    include: { customer: true }
                },
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(returns)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch returns' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId, reason, items, status: requestedStatus } = body // items: { productId, quantity, price }[]
        const isRequest = requestedStatus === 'RETURN_REQUESTED'

        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing return parameters' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx: any) => {
            // 1. Verify Original Order
            const originalOrder = await tx.order.findUnique({
                where: { id: orderId }
            })

            if (!originalOrder) throw new Error('Original transaction not found')

            // 2. Create the SalesReturn record
            const totalRefund = items.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0)
            
            const salesReturn = await tx.salesReturn.create({
                data: {
                    orderId,
                    reason: reason || 'Marketplace Return Request',
                    totalRefund,
                    status: isRequest ? 'PENDING' : 'COMPLETED',
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    }
                }
            })

            // 3. Re-increment Inventory Stock ONLY IF not a request
            if (!isRequest) {
                const defaultLocation = await tx.location.findFirst({
                    where: { type: 'STORE' }
                })

                for (const item of items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } }
                    })

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
            }

            // 4. Update Order Status
            // Check if all items in original order are now returned
            const allItems = await tx.orderItem.findMany({ where: { orderId } })
            const returnedItems = await tx.salesReturnItem.findMany({
                where: { salesReturn: { orderId } }
            })
            
            const totalOrderedQty = allItems.reduce((sum: number, i: any) => sum + i.quantity, 0)
            const totalReturnedQty = returnedItems.reduce((sum: number, i: any) => sum + i.quantity, 0)

            let finalStatus = 'PARTIALLY_RETURNED'
            if (totalReturnedQty >= totalOrderedQty) {
                finalStatus = 'RETURNED'
            } else if (isRequest) {
                finalStatus = 'RETURN_REQUESTED'
            }

            await tx.order.update({
                where: { id: orderId },
                data: { status: finalStatus }
            })

            return salesReturn
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Return Error:', error)
        return NextResponse.json({ error: error.message || 'Reverse logistics protocol failure' }, { status: 500 })
    }
}
