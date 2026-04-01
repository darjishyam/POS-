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

        // 6. Unified Recent Ledger (Last 5 Sales + Last 5 Purchases, merged and sorted)
        const [recentSales, recentPurchases] = await Promise.all([
            (prisma as any).order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { customer: { select: { name: true } } }
            }),
            (prisma as any).purchase.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { supplier: { select: { name: true } } }
            })
        ])

        const recentTransactions = [
            ...recentSales.map((s: any) => ({ ...s, type: 'SALE' })),
            ...recentPurchases.map((p: any) => ({ ...p, type: 'PURCHASE' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10)

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
        let totalAmountPaidForPurchases = 0
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
            totalAmountPaidForPurchases = purchaseStats._sum.amountPaid || 0
            totalPurchaseReturn = returnStats._sum.totalRefund || 0
            
            totalPurchaseDue = Math.max(0, totalPurchases - totalAmountPaidForPurchases - totalPurchaseReturn)
        }

        // 9. Sales Return Totals
        const salesReturnStats = await (prisma as any).salesReturn.aggregate({
            where: { createdAt: dateFilter },
            _sum: { totalRefund: true }
        })
        const totalSalesReturn = salesReturnStats._sum.totalRefund || 0

        // 10. Financial Pillars (Mission Control Specific)
        let stockValue = 0
        let cashBalance = 0
        let trueCashBalance = 0
        let trueBankBalance = 0
        let thisWeekSales = 0
        let trueToCollect = 0

        if (isAdmin) {
            // A. True To Collect (Drafts & Quotations)
            const pendingOrders = await (prisma as any).order.aggregate({
                where: { 
                    status: { in: ['PENDING', 'DRAFT', 'QUOTATION'] } 
                },
                _sum: { totalAmount: true }
            });
            trueToCollect = pendingOrders._sum.totalAmount || 0;

            // B. Stock Value Calculation (Cost Based)
            const productsWithLatestPurchase = await (prisma as any).product.findMany({
                where: { stock: { gt: 0 } },
                include: { 
                    purchases: { 
                        take: 1, 
                        orderBy: { createdAt: 'desc' } 
                    } 
                }
            })
            
            stockValue = productsWithLatestPurchase.reduce((sum: number, p: any) => {
                const cost = p.purchases[0]?.unitCost || p.price * 0.7
                return sum + (cost * p.stock)
            }, 0)

            // B. Bank & Cash Balance Calculation
            const liquidOrders = await (prisma as any).order.findMany({
                where: { status: { notIn: ['PENDING', 'DRAFT', 'QUOTATION'] } },
                select: { totalAmount: true, paymentMethod: true }
            })
            const liquidPurchases = await (prisma as any).purchase.findMany({
                select: { amountPaid: true, paymentMethod: true }
            })
            const expensesList = await (prisma as any).expense.findMany({
                select: { amount: true }
            })

            let pureCashSales = 0, pureBankSales = 0
            liquidOrders.forEach((o: any) => {
                if (o.paymentMethod === 'CASH') pureCashSales += o.totalAmount
                else pureBankSales += o.totalAmount
            })

            let pureCashPurchases = 0, pureBankPurchases = 0
            liquidPurchases.forEach((p: any) => {
                if (p.paymentMethod === 'CASH') pureCashPurchases += (p.amountPaid || 0)
                else pureBankPurchases += (p.amountPaid || 0)
            })
            
            let pureCashExpenses = 0
            expensesList.forEach((e: any) => {
                pureCashExpenses += e.amount
            })

            trueCashBalance = pureCashSales - pureCashPurchases - pureCashExpenses
            trueBankBalance = pureBankSales - pureBankPurchases
            cashBalance = trueCashBalance + trueBankBalance

            // C. This Week Sales
            const startOfWeek = new Date()
            startOfWeek.setDate(startOfWeek.getDate() - 7)
            const weekSalesAgg = await (prisma as any).order.aggregate({
                where: { createdAt: { gte: startOfWeek } },
                _sum: { totalAmount: true }
            })
            thisWeekSales = weekSalesAgg._sum.totalAmount || 0
        }

        // Calculate Collected Revenue (Paid Only)
        const collectedAgg = await (prisma as any).order.aggregate({
            where: { 
                 createdAt: dateFilter,
                 status: { notIn: ['PENDING', 'DRAFT', 'QUOTATION'] } 
            },
            _sum: { totalAmount: true }
        });
        const collectedRevenue = collectedAgg._sum.totalAmount || 0;

        return NextResponse.json({
            revenue: revenue,
            expenses: expensesSum,
            profit: profit,
            ordersCount: salesStats._count.id || 0,
            lowStockCount,
            totalCustomers,
            recentSales: recentTransactions,
            chartData,
            totalPurchases,
            totalPurchaseDue,
            totalPurchaseReturn,
            totalSalesReturn,
            totalSalesAllTime: totalPurchases, // Using purchases as proxy for stock value if needed, but we have stockValue now
            netRevenue: revenue - expensesSum,
            // New Metrics
            toCollectProfit: trueToCollect, // Actual Pending Orders value, keeping key name for frontend compatibility
            collectedRevenue: collectedRevenue,
            toPayDues: totalPurchaseDue,
            paidOut: totalAmountPaidForPurchases,
            stockValue,
            cashBalance,
            trueCashBalance,
            trueBankBalance,
            thisWeekSales
        })
    } catch (error) {
        console.error('Dashboard Stats Error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
