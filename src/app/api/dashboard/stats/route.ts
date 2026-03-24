import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const role = await getRole()
        const isAdmin = role === 'admin'

        const today = new Date()
        const startOfToday = new Date(today.setHours(0, 0, 0, 0))

        // 1. Total Sales Today
        const salesToday = await (prisma as any).order.aggregate({
            where: { createdAt: { gte: startOfToday } },
            _sum: { totalAmount: true },
            _count: { id: true }
        })

        // 2. Expenses Today (Admin Only)
        let expensesTodaySum = 0
        if (isAdmin) {
            const expensesToday = await (prisma as any).expense.aggregate({
                where: { date: { gte: startOfToday } },
                _sum: { amount: true }
            })
            expensesTodaySum = expensesToday._sum.amount || 0
        }

        // 3. COGS Today (Admin Only)
        let totalCogsToday = 0
        if (isAdmin) {
            const orderItemsToday = await (prisma as any).orderItem.findMany({
                where: { order: { createdAt: { gte: startOfToday } } },
                include: { product: { include: { purchases: { take: 1, orderBy: { createdAt: 'desc' } } } } }
            })

            totalCogsToday = orderItemsToday.reduce((sum: number, item: any) => {
                const unitCost = item.product.purchases[0]?.unitCost || item.price * 0.6
                return sum + (unitCost * item.quantity)
            }, 0)
        }

        // 4. Low Stock Count
        const lowStockCount = await (prisma as any).product.count({
            where: { stock: { lte: 5 } }
        })

        // 5. Total Customers
        const totalCustomers = await (prisma as any).customer.count()

        // 6. Recent Sales (last 5)
        const recentSales = await (prisma as any).order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { name: true } } }
        })

        const revenue = salesToday._sum.totalAmount || 0
        const profit = isAdmin ? revenue - (totalCogsToday + expensesTodaySum) : 0

        // 7. Last 30 Days Sales Data (for chart)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const thirtyDaySales = await (prisma as any).order.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _sum: { totalAmount: true }
        })

        // Group by date
        const chartDataMap = new Map()
        thirtyDaySales.forEach((sale: any) => {
            const dateStr = new Date(sale.createdAt).toLocaleDateString()
            chartDataMap.set(dateStr, (chartDataMap.get(dateStr) || 0) + sale._sum.totalAmount)
        })

        const chartData = Array.from({ length: 30 }, (_, i) => {
            const d = new Date()
            d.setDate(d.getDate() - (29 - i))
            const dateStr = d.toLocaleDateString()
            return {
                date: dateStr,
                sales: chartDataMap.get(dateStr) || 0
            }
        })

        // 8. Purchase Totals (Admin Only)
        let totalPurchases = 0
        if (isAdmin) {
            const purchases = await (prisma as any).purchase.aggregate({
                _sum: { totalAmount: true }
            })
            totalPurchases = purchases._sum.totalAmount || 0
        }

        return NextResponse.json({
            revenueToday: revenue,
            expensesToday: isAdmin ? expensesTodaySum : 0,
            profitToday: profit,
            ordersToday: salesToday._count.id || 0,
            lowStockCount,
            totalCustomers,
            recentSales,
            chartData,
            totalPurchases,
            netRevenue: revenue - expensesTodaySum // Simple net calculation for the dashboard
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
