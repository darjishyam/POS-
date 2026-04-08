import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Identity and Code required' }, { status: 400 });
    }

    // 1. Check OTP in Prisma
    const otpRecord = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.code !== code) {
      return NextResponse.json({ error: 'Invalid verification signature' }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'Verification window expired' }, { status: 400 });
    }

    // 2. Clear the OTP record now that it's used
    await prisma.otpCode.delete({
      where: { email },
    });

    // 3. Mark User as verified in Prisma
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isVerified: true },
    });

    // 4. Mark User as verified in Firebase using Admin SDK
    if (adminAuth) {
      try {
        const firebaseUser = await adminAuth.getUserByEmail(email);
        await adminAuth.updateUser(firebaseUser.uid, {
          emailVerified: true,
        });
        console.log(`✅ Firebase User ${email} marked as emailVerified`);
      } catch (fbError) {
        console.error('⚠️ Firebase Admin update failed:', fbError);
        // We don't fail the whole request because Prisma is already updated
      }
    }

    return NextResponse.json({ message: 'Identity parameters synchronized. Access granted.' });
  } catch (error: any) {
    console.error('OTP Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Verification protocol failed' }, { status: 500 });
  }
}
