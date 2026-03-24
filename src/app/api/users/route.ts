import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getRole } from '@/lib/roles'

export async function GET() {
    try {
        const role = await getRole()
        if (role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const users = await (prisma as any).user.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            }
        })

        return NextResponse.json(users)
    } catch (error) {
        console.error('Fetch Users Error:', error)
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }
}
