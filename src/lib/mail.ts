import { resend } from '@/lib/resend';
import { VerificationEmail, getVerificationEmailText } from '@/emails/verification-email';
import { PasswordResetEmail, getPasswordResetEmailText } from '@/emails/password-reset-email';
import React from 'react';

const domain = process.env.NEXT_PUBLIC_APP_URL;
const from_no_reply = process.env.FROM_EMAIL_NO_REPLY || 'NameGame <onboarding@resend.dev>';

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Confirm your email',
    react: React.createElement(VerificationEmail, { confirmLink }),
    text: getVerificationEmailText(confirmLink),
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/reset/new-password?token=${token}`;

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Reset your password',
    react: React.createElement(PasswordResetEmail, { resetLink }),
    text: getPasswordResetEmailText(resetLink),
  });
};
