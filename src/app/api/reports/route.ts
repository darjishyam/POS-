import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get('type') || 'profit-loss'

    try {
        if (type === 'expenses') {
            const expenses = await prisma.expense.findMany({
                include: { category: true },
                orderBy: { date: 'desc' }
            })

            // Group by category for breakdown
            const categoryGroups: Record<string, number> = {}
            expenses.forEach((exp: any) => {
                const catName = exp.category?.name || 'Uncategorized'
                categoryGroups[catName] = (categoryGroups[catName] || 0) + exp.amount
            })

            const breakdown = Object.entries(categoryGroups).map(([name, value]) => ({ name, value }))

            return NextResponse.json({ expenses, breakdown })
        }

        if (type === 'stock') {
            const products = await prisma.product.findMany({
                select: {
                    name: true,
                    stock: true,
                    price: true,
                    category: { select: { name: true } }
                }
            })
            return NextResponse.json(products)
        }

        if (type === 'purchase-sale') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const sales = await prisma.order.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { totalAmount: true, createdAt: true }
            })

            const purchases = await prisma.purchase.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { totalAmount: true, createdAt: true }
            })

            return NextResponse.json({ sales, purchases })
        }

        if (type === 'cash-bank') {
            const sevenDaysAgo = new Date()
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

            const orders = await prisma.order.findMany({
                where: { createdAt: { gte: sevenDaysAgo }, status: { notIn: ['PENDING', 'DRAFT', 'QUOTATION'] } },
                select: { totalAmount: true, paymentMethod: true, createdAt: true }
            })

            const purchases = await prisma.purchase.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { amountPaid: true, paymentMethod: true, createdAt: true }
            })

            const expensesData = await prisma.expense.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { amount: true, createdAt: true }
            })

            const dailyStats: Record<string, any> = {}

            for (let i = 0; i < 7; i++) {
                const date = new Date()
                date.setDate(date.getDate() - i)
                const dateStr = date.toISOString().split('T')[0]
                dailyStats[dateStr] = { 
                    date: dateStr, 
                    cashIn: 0, 
                    bankIn: 0, 
                    cashOut: 0, 
                    bankOut: 0 
                }
            }

            orders.forEach((o: any) => {
                const d = o.createdAt.toISOString().split('T')[0]
                if (dailyStats[d]) {
                    if (o.paymentMethod === 'CASH') dailyStats[d].cashIn += o.totalAmount
                    else dailyStats[d].bankIn += o.totalAmount
                }
            })

            purchases.forEach((p: any) => {
                const d = p.createdAt.toISOString().split('T')[0]
                if (dailyStats[d]) {
                    if (p.paymentMethod === 'CASH') dailyStats[d].cashOut += p.amountPaid
                    else dailyStats[d].bankOut += p.amountPaid
                }
            })

            expensesData.forEach((e: any) => {
                const d = e.createdAt.toISOString().split('T')[0]
                if (dailyStats[d]) {
                    dailyStats[d].cashOut += e.amount // Assume general expenses are cash for now
                }
            })

            const chartData = Object.values(dailyStats).sort((a: any, b: any) => a.date.localeCompare(b.date))
            return NextResponse.json(chartData)
        }

        // Default: Profit & Loss (Sales vs Expenses)
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

        const orders = await prisma.order.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { totalAmount: true, createdAt: true },
            orderBy: { createdAt: 'asc' }
        })

        const expenses = await prisma.expense.findMany({
            where: { createdAt: { gte: sevenDaysAgo } },
            select: { amount: true, createdAt: true }
        })

        // Group by day
        const dailyStats: Record<string, { sales: number, expenses: number }> = {}

        for (let i = 0; i < 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() - i)
            const dateStr = date.toISOString().split('T')[0]
            dailyStats[dateStr] = { sales: 0, expenses: 0 }
        }

        orders.forEach((order: any) => {
            const dateStr = order.createdAt.toISOString().split('T')[0]
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].sales += order.totalAmount
            }
        })

        expenses.forEach((exp: any) => {
            const dateStr = exp.createdAt.toISOString().split('T')[0]
            if (dailyStats[dateStr]) {
                dailyStats[dateStr].expenses += exp.amount
            }
        })

        const chartData = Object.entries(dailyStats)
            .map(([date, stats]) => ({
                date,
                sales: stats.sales,
                expenses: stats.expenses,
                netProfit: stats.sales - stats.expenses
            }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return NextResponse.json(chartData)
    } catch (error) {
        console.error('Reports Error:', error)
        return NextResponse.json({ error: 'Failed to fetch intelligence details' }, { status: 500 })
    }
}
