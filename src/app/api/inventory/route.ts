import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { stock: 'asc' }
        })

        const totalValue = products.reduce((sum: number, p: any) => sum + (p.price * p.stock), 0)
        const lowStockItems = products.filter((p: any) => p.stock <= 5)
        const outOfStockItems = products.filter((p: any) => p.stock === 0)

        return NextResponse.json({
            products,
            stats: {
                totalValue,
                lowStockCount: lowStockItems.length,
                outOfStockCount: outOfStockItems.length,
                totalItems: products.length
            }
        })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, adjustment } = body

        const product = await prisma.product.update({
            where: { id },
            data: {
                stock: {
                    increment: parseInt(adjustment)
                }
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 })
    }
}
