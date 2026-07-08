import { prisma } from '@/lib/prisma';

const OTP_EXPIRY_MINUTES = 5;
const OTP_RATE_LIMIT_MINUTES = 1;

export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function createOtp(phone: string): Promise<{ code: string; error?: string }> {
  // Rate limit: one OTP per phone per minute
  const recent = await prisma.otpCode.findFirst({
    where: {
      phone,
      createdAt: { gte: new Date(Date.now() - OTP_RATE_LIMIT_MINUTES * 60 * 1000) },
    },
  });

  if (recent) {
    return { code: '', error: 'Please wait 1 minute before requesting another OTP.' };
  }

  // Invalidate any existing unused OTPs for this phone
  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  const code      = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, code, expiresAt } });

  return { code };
}

export async function verifyOtp(
  phone: string,
  code: string
): Promise<{ valid: boolean; error?: string }> {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, code, used: false },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return { valid: false, error: 'Invalid OTP code.' };
  }

  if (otp.expiresAt < new Date()) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });
    return { valid: false, error: 'OTP has expired. Please request a new one.' };
  }

  // Mark as used
  await prisma.otpCode.update({ where: { id: otp.id }, data: { used: true } });

  return { valid: true };
}
