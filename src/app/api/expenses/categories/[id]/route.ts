import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const category = await prisma.expenseCategory.findUnique({
            where: { id: params.id }
        })
        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await req.json()
        const { name, description } = body

        const category = await prisma.expenseCategory.update({
            where: { id: params.id },
            data: { name, description }
        })

        return NextResponse.json(category)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.expenseCategory.delete({
            where: { id: params.id }
        })
        return NextResponse.json({ message: 'Category deleted' })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
    }
}
