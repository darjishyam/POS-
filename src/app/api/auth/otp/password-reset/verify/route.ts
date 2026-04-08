import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Email, code, and newPassword required' }, { status: 400 });
    }

    // 1. Verify OTP
    const otpRecord = await prisma.otpCode.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.code !== code) {
      return NextResponse.json({ error: 'Invalid verification signature' }, { status: 400 });
    }

    if (new Date() > otpRecord.expiresAt) {
      return NextResponse.json({ error: 'Verification window expired' }, { status: 400 });
    }

    // 2. Update Firebase password
    if (!adminAuth) {
      return NextResponse.json({ error: 'Firebase Admin not initialized' }, { status: 500 });
    }

    const firebaseUser = await adminAuth.getUserByEmail(email);
    await adminAuth.updateUser(firebaseUser.uid, { password: newPassword });

    // Invalidate existing refresh tokens so the new password takes effect cleanly
    try {
      await adminAuth.revokeRefreshTokens(firebaseUser.uid);
    } catch (revokeErr) {
      console.warn('Password reset: refresh token revocation failed:', revokeErr);
    }

    // 3. Best-effort sync Prisma password hash (in case anything uses it)
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      });
    } catch (prismaErr) {
      // Non-fatal: Prisma password may not be used for sign-in in this app.
      console.warn('Password reset: Prisma password sync failed:', prismaErr);
    }

    // 4. Clear OTP after a successful reset
    try {
      await prisma.otpCode.delete({
        where: { email },
      });
    } catch (otpDeleteErr) {
      // Non-fatal: don't fail the password reset if OTP cleanup fails.
      console.warn('Password reset: OTP cleanup failed:', otpDeleteErr);
    }

    return NextResponse.json({ message: 'Password updated successfully. You can now log in.' });
  } catch (error: any) {
    console.error('Password Reset OTP Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Password reset verification failed' }, { status: 500 });
  }
}

