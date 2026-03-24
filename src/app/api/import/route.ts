import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { type, data } = await req.json()

        if (!Array.isArray(data)) {
            return NextResponse.json({ error: 'Data must be an array' }, { status: 400 })
        }

        if (type === 'products') {
            const result = await prisma.$transaction(async (tx: any) => {
                const created = []
                const skipped = []

                for (const item of data) {
                    // Basic validation
                    if (!item.name || !item.price) {
                        skipped.push({ item, reason: 'Missing name or price' })
                        continue
                    }

                    // Check for existing SKU
                    if (item.sku) {
                        const existing = await tx.product.findUnique({
                            where: { sku: item.sku }
                        })
                        if (existing) {
                            skipped.push({ item, reason: `SKU ${item.sku} already exists` })
                            continue
                        }
                    }

                    const newItem = await tx.product.create({
                        data: {
                            name: item.name,
                            price: parseFloat(item.price) || 0,
                            stock: parseInt(item.stock) || 0,
                            sku: item.sku || `IMPORT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
                            image: item.image || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=200",
                            description: item.description || ''
                        }
                    })
                    created.push(newItem)
                }
                return { created, skipped }
            })
            return NextResponse.json(result)
        }

        if (type === 'customers') {
            const result = await prisma.$transaction(async (tx: any) => {
                const created = []
                const skipped = []

                for (const item of data) {
                    if (!item.name) {
                        skipped.push({ item, reason: 'Missing name' })
                        continue
                    }

                    // Check for existing email/phone if provided
                    if (item.email || item.phone) {
                        const existing = await tx.customer.findFirst({
                            where: {
                                OR: [
                                    item.email ? { email: item.email } : {},
                                    item.phone ? { phone: item.phone } : {}
                                ].filter(obj => Object.keys(obj).length > 0)
                            }
                        })
                        if (existing) {
                            skipped.push({ item, reason: 'Email or Phone already exists in registry' })
                            continue
                        }
                    }

                    const newCustomer = await tx.customer.create({
                        data: {
                            name: item.name,
                            email: item.email || null,
                            phone: item.phone || null
                        }
                    })
                    created.push(newCustomer)
                }
                return { created, skipped }
            })
            return NextResponse.json(result)
        }

        return NextResponse.json({ error: 'Invalid import type' }, { status: 400 })
    } catch (error) {
        console.error('Import failure:', error)
        return NextResponse.json({ error: 'Internal server error during ingestion' }, { status: 500 })
    }
}
