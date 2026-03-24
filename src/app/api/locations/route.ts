import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            include: {
                _count: {
                    select: { stocks: true }
                }
            },
            orderBy: { name: 'asc' }
        })
        return NextResponse.json(locations)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, address, type } = body

        if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

        const location = await prisma.location.create({
            data: { name, address, type }
        })

        return NextResponse.json(location)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create location' }, { status: 500 })
    }
}
