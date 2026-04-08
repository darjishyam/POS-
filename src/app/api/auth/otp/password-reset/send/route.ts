import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOTPEmail } from '@/lib/nodemailer';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email identity required' }, { status: 400 });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP keyed by email (same table used by other OTP flows)
    await prisma.otpCode.upsert({
      where: { email },
      update: { code: otp, expiresAt },
      create: { email, code: otp, expiresAt },
    });

    // Send OTP via your existing SMTP transport
    await sendOTPEmail(email, otp);

    return NextResponse.json({ message: 'Verification code dispatched to your uplink' });
  } catch (error: any) {
    console.error('Password Reset OTP Send Error:', error);
    return NextResponse.json({ error: error.message || 'Verification protocol failed' }, { status: 500 });
  }
}

