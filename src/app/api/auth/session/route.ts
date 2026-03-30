import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // Create a session cookie (expires in 5 days)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    if (!adminAuth) {
      throw new Error('Firebase Admin not initialized. Check server logs.');
    }
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // Sync with Prisma database
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
    const { email, name, uid } = decodedToken;

    if (email) {
      const prisma = (await import('@/lib/prisma')).default;
      const userName = name || email.split('@')[0];

      // Dual-Identity Sync Protocol
      // 1. Sync Authentication Matrix (User Table)
      const userResult = await prisma.user.upsert({
        where: { email },
        update: { 
          name: userName,
          isVerified: decodedToken.email_verified || false
          // Note: We don't update role here to avoid demoting admins
        },
        create: {
          email,
          name: userName,
          password: 'LINKED_TO_FIREBASE',
          isVerified: decodedToken.email_verified || false,
          role: 'USER' // Default to non-personnel
        }
      });

      // 2. Sync Sales Matrix (Customer Table)
      // This ensures any person who logins is immediately available as a Customer in the POS
      await prisma.customer.upsert({
        where: { email },
        update: { name: userName },
        create: {
          email,
          name: userName,
          customerGroupId: null // Default group
        }
      });
    }

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Session API Error', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return NextResponse.json({ status: 'success' });
}
