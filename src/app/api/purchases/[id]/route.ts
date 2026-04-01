import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const purchase = await prisma.purchase.findUnique({
            where: { id },
            include: {
                supplier: true,
                location: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!purchase) {
            return NextResponse.json({ error: 'Purchase not found' }, { status: 404 })
        }

        return NextResponse.json(purchase)
    } catch (error) {
        console.error('Purchase GET ID Error:', error)
        return NextResponse.json({ error: 'Failed to fetch purchase details' }, { status: 500 })
    }
}
