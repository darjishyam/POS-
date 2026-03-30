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

export async function POST(request: Request) {
    try {
        const role = await getRole()
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const body = await request.json()
        const { email, name, personnelRole } = body

        const user = await (prisma as any).user.upsert({
            where: { email },
            update: { role: personnelRole || 'CASHIER', name: name },
            create: {
                email,
                name: name || email.split('@')[0],
                password: 'PRE_REGISTERED_BY_ADMIN',
                role: personnelRole || 'CASHIER'
            }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Personnel POST Error:', error)
        return NextResponse.json({ error: 'Failed to enroll personnel' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const role = await getRole()
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const body = await request.json()
        const { userId, role: newRole } = body

        const user = await (prisma as any).user.update({
            where: { id: userId },
            data: { role: newRole }
        })

        return NextResponse.json(user)
    } catch (error) {
        console.error('Personnel PATCH Error:', error)
        return NextResponse.json({ error: 'Failed to update personnel role' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    try {
        const role = await getRole()
        if (role !== 'admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const email = searchParams.get('email')

        if (userId) {
            await (prisma as any).user.delete({ where: { id: userId } })
        } else if (email) {
            await (prisma as any).user.delete({ where: { email } })
        }

        return NextResponse.json({ status: 'purged' })
    } catch (error) {
        console.error('Personnel DELETE Error:', error)
        return NextResponse.json({ error: 'Failed to purge personnel' }, { status: 500 })
    }
}
