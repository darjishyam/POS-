import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Identity and token required' }, { status: 400 });
    }

    // 1. Verify token in database
    const otpRecord = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.code !== code) {
      return NextResponse.json({ error: 'Invalid security token' }, { status: 401 });
    }

    // 2. Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'Security token expired' }, { status: 401 });
    }

    // 3. Update Database Status
    // We attempt to find/create the user record to link verification
    await prisma.user.upsert({
      where: { email },
      update: { isVerified: true },
      create: { 
        email, 
        isVerified: true,
        password: 'LINKED_TO_FIREBASE', // Placeholder
        name: email.split('@')[0],
      },
    });

    // 4. Update Firebase Custom Claims
    // Find the user by email in Firebase
    try {
      const firebaseUser = await adminAuth.getUserByEmail(email);
      await adminAuth.setCustomUserClaims(firebaseUser.uid, {
        verified: true
      });
      console.log(`✅ Security claims synchronized for ${email}`);
    } catch (firebaseError) {
      console.warn('Firebase user sync failed (normal during manual DB edits):', firebaseError);
    }

    // 5. Cleanup the token
    await prisma.otpCode.delete({
      where: { email },
    });

    return NextResponse.json({ success: true, message: 'Identity authenticated' });
  } catch (error) {
    console.error('OTP Verification Error:', error);
    return NextResponse.json({ error: 'Internal security authentication failure' }, { status: 500 });
  }
}
