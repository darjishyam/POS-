import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                _count: {
                    select: { orders: true }
                },
                customerGroup: true
            },
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(customers)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, phone } = body

        const customer = await prisma.customer.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                customerGroupId: body.customerGroupId || null
            }
        })

        return NextResponse.json(customer)
    } catch (error: any) {
        console.error('Customer Error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email or Phone already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id, name, email, phone, customerGroupId } = body

        const customer = await prisma.customer.update({
            where: { id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                customerGroupId: customerGroupId || null
            }
        })

        return NextResponse.json(customer)
    } catch (error: any) {
        console.error('Customer PATCH Error:', error)
        return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 })
    }
}
