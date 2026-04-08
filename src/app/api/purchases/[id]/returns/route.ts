import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendLowStockAlert } from '@/lib/nodemailer'
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: purchaseId } = await params
        const body = await request.json()
        const { reason, items } = body // items: [{ productId, quantity }]

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items specified for return' }, { status: 400 })
        }

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Get original purchase and check items
            const purchase = await tx.purchase.findUnique({
                where: { id: purchaseId },
                include: { items: true }
            })

            if (!purchase) throw new Error('Purchase record not found')

            let totalRefund = 0
            const returnItemsData = []

            // 2. Process each return item
            for (const item of items) {
                const originalItem = purchase.items.find((i: any) => i.productId === item.productId)
                if (!originalItem) throw new Error(`Product ${item.productId} not found in original purchase`)
                if (item.quantity > originalItem.quantity) throw new Error(`Return quantity exceeds original purchase for product ${item.productId}`)

                const itemRefund = originalItem.unitCost * item.quantity
                totalRefund += itemRefund

                returnItemsData.push({
                    productId: item.productId,
                    quantity: item.quantity,
                    unitCost: originalItem.unitCost
                })

                // 3. Decrement Inventory Stock
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity }
                    }
                })
            }

            const purchaseReturn = await tx.purchaseReturn.create({
                data: {
                    purchaseId,
                    reason,
                    totalRefund,
                    status: 'COMPLETED',
                    items: {
                        create: returnItemsData
                    }
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            return purchaseReturn
        })

        // 5. Low Stock Alerts (Role-Based)
        if (result && result.items) {
            try {
                const admins = await prisma.user.findMany({
                    where: { role: 'ADMIN' },
                    select: { email: true }
                });
                const adminEmails = admins.map((a: { email: string }) => a.email);

                if (adminEmails.length > 0) {
                    for (const item of result.items) {
                        const product = item.product;
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

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Purchase Return Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to process purchase return' }, { status: 500 })
    }
}
