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
        const validation = productSchema.partial().safeParse(body)
        if (!validation.success) {
            console.error('PATCH Validation Error:', validation.error.format())
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const { supplierId, purchaseCost, ...productInfo } = validation.data
        
        // Nullify empty ID strings to prevent Prisma foreign key constraint errors
        const updateData: any = { ...productInfo };
        if (updateData.brandId === "") updateData.brandId = null;
        if (updateData.unitId === "") updateData.unitId = null;
        if (updateData.categoryId === "") updateData.categoryId = null;
        if (updateData.taxId === "") updateData.taxId = null;

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
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
