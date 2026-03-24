import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
    try {
        let settings = await prisma.setting.findUnique({
            where: { id: 'system' }
        })

        if (!settings) {
            settings = await prisma.setting.create({
                data: { id: 'system' }
            })
        }

        return NextResponse.json(settings)
    } catch (error) {
        console.error('Settings GET Error:', error)
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const body = await req.json()
        const settings = await prisma.setting.upsert({
            where: { id: 'system' },
            update: body,
            create: { id: 'system', ...body }
        })
        return NextResponse.json(settings)
    } catch (error) {
        console.error('Settings PATCH Error:', error)
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
    }
}
