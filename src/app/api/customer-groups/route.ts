import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const groups = await prisma.customerGroup.findMany({
            include: {
                _count: {
                    select: { customers: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(groups)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, discount } = body

        if (!name) return NextResponse.json({ error: 'Designation is required' }, { status: 400 })

        const group = await prisma.customerGroup.create({
            data: { name, discount: parseFloat(discount) || 0 }
        })

        return NextResponse.json(group)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to authorize tier' }, { status: 500 })
    }
}

// PATCH: Update group
export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const { id, name, discount } = body

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        const group = await prisma.customerGroup.update({
            where: { id },
            data: { 
                name: name?.toUpperCase(), 
                discount: discount !== undefined ? parseFloat(discount) : undefined 
            }
        })

        return NextResponse.json(group)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
    }
}

// DELETE: Remove group
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await prisma.customerGroup.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Failed to purge tier' }, { status: 500 })
    }
}
