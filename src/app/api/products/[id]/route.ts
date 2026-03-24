import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { productSchema } from '@/lib/validations'

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        
        // Dynamic Validation Protocol
        const validation = productSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const product = await prisma.product.update({
            where: { id },
            data: validation.data,
            include: { category: true }
        })
        return NextResponse.json(product)
    } catch (error: any) {
        console.error('Update Error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'SKU Conflict: Protocol Terminated' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await prisma.product.delete({
            where: { id }
        })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: 'Deletion failed' }, { status: 500 })
    }
}
