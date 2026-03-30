import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRole } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const range = searchParams.get('range') || 'all'
        
        const role = await getRole()
        const isAdmin = role === 'admin'

        // 0. Calculate Date Filter
        const now = new Date()
        let dateFilter: any = {}
        
        if (range === 'today') {
            const startOfToday = new Date(now.setHours(0, 0, 0, 0))
            dateFilter = { gte: startOfToday }
        } else if (range === 'week') {
            const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            dateFilter = { gte: startOfWeek }
        } else if (range === 'month') {
            const startOfMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            dateFilter = { gte: startOfMonth }
        }
        // 'all' means empty dateFilter {}

        // 1. Sales Stats
        const salesStats = await (prisma as any).order.aggregate({
            where: { createdAt: dateFilter },
            _sum: { totalAmount: true },
            _count: { id: true }
        })

        // 2. Expenses
        let expensesSum = 0
        if (isAdmin) {
            const expensesAgg = await (prisma as any).expense.aggregate({
                where: { date: dateFilter },
                _sum: { amount: true }
            })
            expensesSum = expensesAgg._sum.amount || 0
        }

        // 3. COGS Calculation
        let totalCogs = 0
        if (isAdmin) {
            const orderItems = await (prisma as any).orderItem.findMany({
                where: { order: { createdAt: dateFilter } },
                include: { product: { include: { purchases: { take: 1, orderBy: { createdAt: 'desc' } } } } }
            })

            totalCogs = orderItems.reduce((sum: number, item: any) => {
                const unitCost = item.product.purchases[0]?.unitCost || item.price * 0.6
                return sum + (unitCost * item.quantity)
            }, 0)
        }

        // 4. Low Stock Count (Always Live Snapshot)
        const lowStockCount = await (prisma as any).product.count({
            where: { stock: { lte: 5 } }
        })

        // 5. Total Customers (Filtered by Join Date if range is set)
        const customerFilter = range === 'all' ? {} : { createdAt: dateFilter }
        const totalCustomers = await (prisma as any).customer.count({
            where: customerFilter
        })

        // 6. Recent Sales (Always Last 5)
        const recentSales = await (prisma as any).order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: { customer: { select: { name: true } } }
        })

        const revenue = salesStats._sum.totalAmount || 0
        const profit = isAdmin ? revenue - (totalCogs + expensesSum) : 0
        
        // 7. Last 30 Days Sales Data (for chart - always 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        
        const thirtyDaySales = await (prisma as any).order.groupBy({
            by: ['createdAt'],
            where: { createdAt: { gte: thirtyDaysAgo } },
            _sum: { totalAmount: true }
        })

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

        // 8. Purchase Totals
        let totalPurchases = 0
        let totalPurchaseDue = 0
        let totalPurchaseReturn = 0
        if (isAdmin) {
            const purchaseStats = await (prisma as any).purchase.aggregate({
                where: { createdAt: dateFilter },
                _sum: { totalAmount: true, amountPaid: true }
            })
            const returnStats = await (prisma as any).purchaseReturn.aggregate({
                where: { createdAt: dateFilter },
                _sum: { totalRefund: true }
            })
            totalPurchases = purchaseStats._sum.totalAmount || 0
            const totalPaid = purchaseStats._sum.amountPaid || 0
            totalPurchaseReturn = returnStats._sum.totalRefund || 0
            
            totalPurchaseDue = Math.max(0, totalPurchases - totalPaid - totalPurchaseReturn)
        }

        // 9. Sales Return Totals
        const salesReturnStats = await (prisma as any).salesReturn.aggregate({
            where: { createdAt: dateFilter },
            _sum: { totalRefund: true }
        })
        const totalSalesReturn = salesReturnStats._sum.totalRefund || 0

        // 10. All-Time Stats for Comparison (Optional)
        const globalSales = await (prisma as any).order.aggregate({ _sum: { totalAmount: true } })

        return NextResponse.json({
            revenue: revenue,
            expenses: expensesSum,
            profit: profit,
            ordersCount: salesStats._count.id || 0,
            lowStockCount,
            totalCustomers,
            recentSales,
            chartData,
            totalPurchases,
            totalPurchaseDue,
            totalPurchaseReturn,
            totalSalesReturn,
            totalSalesAllTime: globalSales._sum.totalAmount || 0,
            netRevenue: revenue - expensesSum
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
