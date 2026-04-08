import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendLowStockAlert } from '@/lib/nodemailer'
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                customer: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        return NextResponse.json(order)
    } catch (error) {
        console.error('Order GET ID Error:', error)
        return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 })
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: orderId } = await params
        const body = await request.json()
        const { status } = body

        // Fetch current order to check transition
        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        })

        if (!currentOrder) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Logic for converting QUOTATION or DRAFT to COMPLETED
        const isAcquisitionFinalization = 
            (currentOrder.status === 'QUOTATION' || currentOrder.status === 'DRAFT') && 
            status === 'COMPLETED'

        const order = await prisma.$transaction(async (tx: any) => {
            // 1. Update order status
            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: { status },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            // 2. If finalization, deduct stock
            if (isAcquisitionFinalization) {
                const defaultLocation = await tx.location.findFirst({
                    where: { type: 'STORE' }
                })

                if (defaultLocation) {
                    for (const item of currentOrder.items) {
                        await tx.locationStock.upsert({
                            where: {
                                productId_locationId: {
                                    productId: item.productId,
                                    locationId: defaultLocation.id
                                }
                            },
                            update: {
                                quantity: { decrement: item.quantity }
                            },
                            create: {
                                productId: item.productId,
                                locationId: defaultLocation.id,
                                quantity: -item.quantity
                            }
                        })
                        
                        // Also update global stock
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: { decrement: item.quantity }
                            }
                        })
                    }
                }
            }

            return updatedOrder
        })

        // 3. Low Stock Alerts (Role-Based)
        if (isAcquisitionFinalization && order) {
            try {
                const admins = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { email: true }
                });
                const adminEmails = admins.map((a: { email: string }) => a.email);

                if (adminEmails.length > 0) {
                    // Refetch products to get final stock levels after decrement
                    const productIds = order.items.map((i: { productId: string }) => i.productId);
                    const updatedProducts = await prisma.product.findMany({
                        where: { id: { in: productIds } }
                    });

                    for (const product of updatedProducts) {
                        if (product.manageStock && product.stock <= product.alertQuantity) {
                            await sendLowStockAlert(adminEmails, {
                                name: product.name,
                                sku: product.sku,
                                stock: product.stock,
                                alertQuantity: product.alertQuantity
                            });
                        }
                    }
                }
            } catch (alertError) {
                console.error('Low Stock Alert failed (non-fatal):', alertError);
            }
        }

        return NextResponse.json(order)
    } catch (error: any) {
        console.error('Order Patch Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to update order' }, { status: 500 })
    }
}
