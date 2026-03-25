import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const { status } = body
        const orderId = params.id

        // Fetch current order to check transition
        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        })

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Logic for converting QUOTATION or DRAFT to COMPLETED
        const isAcquisitionFinalization = 
            (currentOrder.status === 'QUOTATION' || currentOrder.status === 'DRAFT') && 
            status === 'COMPLETED'

        const order = await prisma.$transaction(async (tx: any) => {
            // 1. Update order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status }
            })

            // 2. If finalization, deduct stock
            if (isAcquisitionFinalization) {
                const defaultLocation = await tx.location.findFirst({
                    where: { type: 'STORE' }
                })

                if (defaultLocation) {
                    for (const item of currentOrder.items) {
                        await tx.locationStock.upsert({
                            where: {
                                productId_locationId: {
                                    productId: item.productId,
                                    locationId: defaultLocation.id
                                }
                            },
                            update: {
                                quantity: { decrement: item.quantity }
                            },
                            create: {
                                productId: item.productId,
                                locationId: defaultLocation.id,
                                quantity: -item.quantity
                            }
                        })
                        
                        // Also update global stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: { decrement: item.quantity }
                            }
                        })
                    }
                }
            }

            return updatedOrder
        })

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Order Patch Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
    }
}
