import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session');

        if (!sessionCookie) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie.value, true);
        const email = decodedToken.email;

        if (!email) {
            return NextResponse.json({ error: 'No email in session' }, { status: 400 });
        }

        const customer = await prisma.customer.findUnique({
            where: { email },
            include: {
                customerGroup: true,
                _count: {
                    select: { orders: true }
                }
            }
        });

        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 });
        }

        return NextResponse.json(customer);
    } catch (error) {
        console.error('Fetch Me Error:', error);
        return NextResponse.json({ error: 'System synchronization failure' }, { status: 500 });
    }
}
