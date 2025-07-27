'use server';

import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';

export async function sendPasswordResetLink(email: string): Promise<{ success?: string; error?: string }> {
  if (!email) {
    return { error: 'Email is required.' };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (!existingUser) {
    // Note: To prevent email enumeration, we return a generic success message.
    // This is a common security practice.
    return { success: 'If email exists, a reset link has been sent and will expire in 1 hour.' };
  }

  try {
    const passwordResetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token
    );
    return { success: 'If email exists, a reset link has been sent and will expire in 1 hour.' };
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    return { error: 'Something went wrong. Please try again.' };
  }
}
