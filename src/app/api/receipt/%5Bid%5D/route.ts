import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                image: true
                            }
                        }
                    }
                },
                customer: {
                    select: {
                        name: true,
                        phone: true,
                        email: true
                    }
                },
                user: {
                    select: {
                        name: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order Registry Not Found' }, { status: 404 })
        }

        // Fetch store settings for branding and currency
        const settings = await prisma.setting.findUnique({
            where: { id: 'system' }
        })

        return NextResponse.json({ order, settings })
    } catch (error) {
        console.error('Receipt API Failure', error)
        return NextResponse.json({ error: 'Internal Server Malfunction' }, { status: 500 })
    }
}
