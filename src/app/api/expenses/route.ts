import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { checkRole } from '@/lib/roles'

const prisma = new PrismaClient()

export async function GET() {
    const isAdmin = await checkRole('admin')
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const expenses = await prisma.expense.findMany({
            orderBy: { date: 'desc' }
        })
        return NextResponse.json(expenses)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const isAdmin = await checkRole('admin')
    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    try {
        const body = await req.json()
        const { amount, description, category, date } = body

        if (!amount || !description || !category) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const expense = await prisma.expense.create({
            data: {
                amount: parseFloat(amount),
                description,
                category,
                date: date ? new Date(date) : new Date()
            }
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Create Expense Error:', error)
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
    }
}
