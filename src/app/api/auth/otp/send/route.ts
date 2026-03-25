import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Uplink address required' }, { status: 400 });
    }

    // 1. Generate 6-digit security token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // 2. Clear old codes and save the new one
    await prisma.otpCode.upsert({
      where: { email },
      update: { code, expiresAt },
      create: { email, code, expiresAt },
    });

    // 3. Dispatch the token
    if (resend) {
      try {
        await resend.emails.send({
          from: 'onboarding@resend.dev',
          to: email,
          subject: `[SECURITY] Your 6-Digit Verification Token`,
          html: `
            <div style="font-family: monospace; background: #fafafa; padding: 40px; text-align: center;">
              <h1 style="color: #000; font-size: 24px; font-weight: 900; margin-bottom: 30px;">IDENTITY VERIFICATION</h1>
              <p style="color: #666; font-size: 14px; margin-bottom: 20px;">Use the following code to authorize your terminal:</p>
              <div style="background: #000; color: #10b981; padding: 20px; font-size: 40px; font-weight: 900; letter-spacing: 12px; display: inline-block; border-radius: 12px;">₹{code}
              </div>
              <p style="color: #999; font-size: 10px; margin-top: 40px;">This token expires in 10 minutes.</p>
            </div>
          `,
        });
        console.log(`✅ OTP [${code}] dispatched to ${email}`);
      } catch (emailError) {
        console.error('Email dispatch failed:', emailError);
        // Fallback to console log in dev
        console.log(`⚠️ DEVELOPMENT FALLBACK: OTP for ${email} is: ${code}`);
      }
    } else {
      console.log(`🚨 NO RESEND_API_KEY: SECURITY TOKEN FOR ${email} IS: ${code}`);
    }

    return NextResponse.json({ success: true, message: 'Security token dispatched' });
  } catch (error) {
    console.error('OTP Dispatch Error:', error);
    return NextResponse.json({ error: 'Internal security synchronization failure' }, { status: 500 });
  }
}
