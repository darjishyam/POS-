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
    } catch (err) {
        console.error('Stock transfer GET error:', err)
        return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 })
    }
}

type TransferItemPayload = {
    productId: string
    quantity: number | string
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as {
            fromLocationId?: string
            toLocationId?: string
            referenceNo?: string | null
            items?: unknown
        }
        const { fromLocationId, toLocationId, referenceNo, items } = body

        if (!fromLocationId || !toLocationId || !items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (fromLocationId === toLocationId) {
            return NextResponse.json({ error: 'Source and destination must be different' }, { status: 400 })
        }

        const normalizedItems: Array<{ productId: string; quantity: number }> = (Array.isArray(items) ? items : [])
            .filter((i): i is TransferItemPayload => {
                if (!i || typeof i !== 'object') return false
                const obj = i as Record<string, unknown>
                const productId = obj.productId
                const quantity = obj.quantity
                const numQty = typeof quantity === 'number' || typeof quantity === 'string' ? Number(quantity) : NaN
                return typeof productId === 'string' && Number.isFinite(numQty) && numQty > 0
            })
            .map((i) => ({
                productId: i.productId,
                quantity: Number(i.quantity),
            }))

        if (normalizedItems.length === 0) {
            return NextResponse.json({ error: 'Invalid items payload' }, { status: 400 })
        }

        const transfer = await prisma.$transaction(async (tx) => {
            // 1. Create the transfer record
            const newTransfer = await tx.stockTransfer.create({
                data: {
                    fromLocationId,
                    toLocationId,
                    referenceNo,
                    status: 'PENDING', // Two-step flow: stock moves only after execution
                    items: {
                        create: normalizedItems.map((item) => ({
                            productId: item.productId,
                            quantity: item.quantity,
                        })),
                    }
                }
            })
            return newTransfer
        }, {
            timeout: 20000 // 20 seconds timeout for bulk stock transfer processing
        })

        return NextResponse.json(transfer)
    } catch (err) {
        console.error('Transfer Error:', err)
        return NextResponse.json({ error: 'Failed to execute transfer' }, { status: 500 })
    }
}
