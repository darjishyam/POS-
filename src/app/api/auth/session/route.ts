import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // 1. Verify ID Token for initial UID
    const decodedIdToken = await adminAuth.verifyIdToken(idToken);
    const { uid, email } = decodedIdToken;

    if (!email) {
        throw new Error('Email is required for session synchronization');
    }

    // 2. Sync with Prisma and Fetch Role
    const prisma = (await import('@/lib/prisma')).default;
    const userName = decodedIdToken.name || email.split('@')[0];

    const dbUser = await prisma.user.upsert({
      where: { email },
      update: { 
        name: userName,
        isVerified: decodedIdToken.email_verified || false
      },
      create: {
        email,
        name: userName,
        password: 'LINKED_TO_FIREBASE',
        isVerified: decodedIdToken.email_verified || false,
        role: 'USER' 
      }
    });

    // 3. Inject Role into Firebase Custom Claims
    // This ensures the role is available in the session cookie and ID token
    const role = dbUser.role.toLowerCase();
    await adminAuth.setCustomUserClaims(uid, { role });

    // 4. Create a session cookie (now includes the fresh role claim)
    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });

    // 5. Sync Sales Matrix (Customer Table)
    await prisma.customer.upsert({
      where: { email },
      update: { name: userName },
      create: {
        email,
        name: userName,
        customerGroupId: null 
      }
    });

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
