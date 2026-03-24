import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { supplierSchema } from '@/lib/validations'

export async function GET() {
    try {
        const suppliers = await prisma.supplier.findMany({
            include: {
                _count: {
                    select: { purchases: true }
                },
                purchases: {
                    select: { totalAmount: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        const formattedSuppliers = suppliers.map((s: any) => ({
            ...s,
            totalPurchaseVolume: s.purchases.reduce((sum: number, p: any) => sum + p.totalAmount, 0)
        }))

        return NextResponse.json(formattedSuppliers)
    } catch (error) {
        console.error('Suppliers GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch suppliers' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        
        // Industrial Schema Validation
        const validation = supplierSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const supplier = await prisma.supplier.create({
            data: validation.data
        })

        return NextResponse.json(supplier)
    } catch (error: any) {
        console.error('Supplier POST Error:', error)
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Email or Phone already exists' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

// PATCH: Update supplier
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { id } = body
        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        // Industrial Schema Validation
        const validation = supplierSchema.safeParse(body)
        if (!validation.success) {
            return NextResponse.json({ 
                error: 'Schema Validation Failure', 
                details: validation.error.format() 
            }, { status: 400 })
        }

        const supplier = await prisma.supplier.update({
            where: { id },
            data: validation.data
        })

        return NextResponse.json(supplier)
    } catch (error) {
        console.error('Supplier PATCH Error:', error)
        return NextResponse.json({ error: 'Update failed' }, { status: 500 })
    }
}

// DELETE: Remove supplier
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

        await prisma.supplier.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Supplier DELETE Error:', error)
        return NextResponse.json({ error: 'Purge failed' }, { status: 500 })
    }
}
