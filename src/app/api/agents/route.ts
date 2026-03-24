import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        const agents = await prisma.agent.findMany({
            include: {
                orders: {
                    select: {
                        totalAmount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })

        // Calculate stats for each agent
        const agentsWithStats = agents.map((agent: any) => {
            const totalSalesValue = agent.orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0)
            const totalCommission = (totalSalesValue * agent.commissionRate) / 100
            
            return {
                ...agent,
                totalOrders: agent.orders.length,
                totalSalesValue,
                totalCommission,
                orders: undefined // Remove orders array to keep response clean
            }
        })

        return NextResponse.json(agentsWithStats)
    } catch (error) {
        console.error('Fetch agents error:', error)
        return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, email, phone, commissionRate } = body

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        }

        const agent = await prisma.agent.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                commissionRate: parseFloat(commissionRate) || 5.0
            }
        })

        return NextResponse.json(agent)
    } catch (error) {
        console.error('Agent creation error:', error)
        return NextResponse.json({ error: 'Failed to register agent' }, { status: 500 })
    }
}
