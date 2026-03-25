import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params
        const { status } = await request.json()

        if (status !== 'RECEIVED') {
            return NextResponse.json({ error: 'Invalid status transition' }, { status: 400 })
        }

        // Use a transaction to update status and increment stock
        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Get the purchase and its items
            const purchase = await tx.purchase.findUnique({
                where: { id },
                include: { items: true }
            })

            if (!purchase) throw new Error('Purchase not found')
            if (purchase.status === 'RECEIVED') throw new Error('Purchase already received')

            // 2. Update status
            const updatedPurchase = await tx.purchase.update({
                where: { id },
                data: { status: 'RECEIVED' }
            })

            // 3. Increment stock for each item
            for (const item of purchase.items) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            increment: item.quantity
                        }
                    }
                })
                
                // 4. Update location-specific stock
                if (purchase.locationId) {
                    await tx.locationStock.upsert({
                        where: {
                            productId_locationId: {
                                productId: item.productId,
                                locationId: purchase.locationId
                            }
                        },
                        update: {
                            quantity: {
                                increment: item.quantity
                            }
                        },
                        create: {
                            productId: item.productId,
                            locationId: purchase.locationId,
                            quantity: item.quantity
                        }
                    })
                }
            }

            return updatedPurchase
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Purchase Status PATCH Error:', error)
        return NextResponse.json({ error: error.message || 'Update failed' }, { status: 500 })
    }
}
