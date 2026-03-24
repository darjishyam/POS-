import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        // Get sales for the last 7 days
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

        // Initialize last 7 days with 0
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

        // Convert to array for charts
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
        return NextResponse.json({ error: 'Failed to fetch sales reports' }, { status: 500 })
    }
}
