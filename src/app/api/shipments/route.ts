import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const shipments = await prisma.shipment.findMany({
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
        return NextResponse.json(shipments)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch shipment ledger' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { orderId, carrier, trackingNumber, items, estimatedDelivery } = body

        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing shipment parameters' }, { status: 400 })
        }

        const shipment = await prisma.$transaction(async (tx) => {
            // 1. Create Shipment Record
            const newShipment = await tx.shipment.create({
                data: {
                    orderId,
                    carrier: carrier || 'SELF',
                    trackingNumber,
                    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : null,
                    status: 'DISPATCHED',
                    shippedAt: new Date(),
                    items: {
                        create: items.map((item: any) => ({
                            productId: item.productId,
                            quantity: item.quantity
                        }))
                    }
                }
            })

            // 2. Optional: If partial shipping is implemented later, we'd adjust order status here.
            // For now, we assume full shipment.
            
            return newShipment
        })

        return NextResponse.json(shipment)
    } catch (error: any) {
        console.error('Shipment Error:', error)
        return NextResponse.json({ error: error.message || 'Logistics protocol failure' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, status, deliveredAt } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing update parameters' }, { status: 400 })
        }

        const updatedShipment = await prisma.shipment.update({
            where: { id },
            data: { 
                status,
                deliveredAt: status === 'DELIVERED' ? new Date() : deliveredAt ? new Date(deliveredAt) : null
            }
        })

        return NextResponse.json(updatedShipment)
    } catch (error: any) {
        return NextResponse.json({ error: 'Status update failed' }, { status: 500 })
    }
}
