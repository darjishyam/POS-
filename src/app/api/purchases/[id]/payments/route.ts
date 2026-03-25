import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { amount, method = 'CASH', reference } = body

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 })
        }

        const result = await (prisma as any).$transaction(async (tx: any) => {
            // 1. Get current purchase
            const purchase = await tx.purchase.findUnique({
                where: { id }
            })

            if (!purchase) {
                throw new Error('Purchase record not found')
            }

            const newPaidAmount = purchase.amountPaid + amount
            
            // 2. Update payment status
            let paymentStatus = 'PARTIAL'
            if (newPaidAmount >= purchase.totalAmount) {
                paymentStatus = 'PAID'
            }

            // 3. Create Payment record
            const payment = await tx.purchasePayment.create({
                data: {
                    purchaseId: id,
                    amount,
                    method,
                    reference,
                    date: new Date()
                }
            })

            // 4. Update Purchase record
            await tx.purchase.update({
                where: { id },
                data: {
                    amountPaid: newPaidAmount,
                    paymentStatus
                }
            })

            return payment
        })

        return NextResponse.json(result)
    } catch (error: any) {
        console.error('Purchase Payment Error:', error)
        return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 })
    }
}
