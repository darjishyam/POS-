import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        let taxes = await prisma.tax.findMany({
            orderBy: { createdAt: 'desc' }
        })

        // Seed default taxes if none exist
        if (taxes.length === 0) {
            await prisma.tax.createMany({
                data: [
                    { name: 'GST 5%', rate: 5.0 },
                    { name: 'GST 12%', rate: 12.0 },
                    { name: 'GST 18%', rate: 18.0 },
                    { name: 'VAT 5%', rate: 5.0 },
                    { name: 'No Tax', rate: 0.0 }
                ]
            })
            taxes = await prisma.tax.findMany({
                orderBy: { rate: 'asc' }
            })
        }

        return NextResponse.json(taxes)
    } catch (error) {
        return NextResponse.json({ error: 'System Registry Failure' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, rate } = body

        if (!name || rate === undefined) {
            return NextResponse.json({ error: 'Incomplete Protocol' }, { status: 400 })
        }

        const tax = await prisma.tax.create({
            data: { 
                name, 
                rate: parseFloat(rate.toString()) 
            }
        })

        return NextResponse.json(tax)
    } catch (error) {
        return NextResponse.json({ error: 'Registration Failure' }, { status: 500 })
    }
}
