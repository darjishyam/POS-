import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, contactPerson, email, phone, address } = body

        const supplier = await prisma.supplier.update({
            where: { id },
            data: {
                name,
                contactPerson,
                email,
                phone,
                address
            }
        })

        return NextResponse.json(supplier)
    } catch (error) {
        console.error('Supplier PUT Error:', error)
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.supplier.delete({
            where: { id }
        })
        return NextResponse.json({ message: 'Supplier deleted successfully' })
    } catch (error) {
        console.error('Supplier DELETE Error:', error)
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
    }
}
