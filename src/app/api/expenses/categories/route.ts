import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const categories = await prisma.expenseCategory.findMany({
            include: {
                _count: {
                    select: { expenses: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(categories)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { name, description } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const category = await prisma.expenseCategory.create({
            data: { name, description }
        })

        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}
