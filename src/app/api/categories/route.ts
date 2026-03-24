import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { categorySchema } from '@/lib/validations'

export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(categories)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // Industrial Validation
        const validation = categorySchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const category = await prisma.category.create({
            data: validation.data
        })

        return NextResponse.json(category)
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
    }
}
