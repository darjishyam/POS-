import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const token = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(token)
        const email = decodedToken.email

        if (!email) {
            return NextResponse.json({ error: 'Identity resolution failure' }, { status: 400 })
        }

        // Find the Customer record associated with this email
        const customer = await prisma.customer.findFirst({
            where: { email }
        })

        if (!customer) {
            return NextResponse.json({ orders: [] })
        }

        const orders = await prisma.order.findMany({
            where: { customerId: customer.id },
            include: {
                items: {
                    include: { product: true }
                },
                shipments: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Fetch Orders Error:', error)
        return NextResponse.json({ error: 'Internal system fault' }, { status: 500 })
    }
}
