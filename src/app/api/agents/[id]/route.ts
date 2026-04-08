import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        const body = await request.json()
        const { name, email, phone, commissionRate } = body

        const agent = await prisma.agent.update({
            where: { id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                commissionRate: parseFloat(commissionRate) || 5.0
            }
        })

        return NextResponse.json(agent)
    } catch (error) {
        console.error('Agent update error:', error)
        return NextResponse.json({ error: 'Failed to update agent' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const id = (await params).id
        
        await prisma.agent.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Agent deletion error:', error)
        return NextResponse.json({ error: 'Failed to delete agent' }, { status: 500 })
    }
}
