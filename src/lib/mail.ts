import { resend } from '@/lib/resend';

const domain = process.env.NEXT_PUBLIC_APP_URL;
const from_no_reply = process.env.FROM_EMAIL_NO_REPLY || 'NameGame <onboarding@resend.dev>';

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${token}`;

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Confirm your email',
    html: `<p>Click <a href="${confirmLink}">here</a> to confirm your email.</p>`,
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/reset/new-password?token=${token}`;

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Reset your password',
    html: `<p>Click <a href="${resetLink}">here</a> to reset your NameGame password.</p>`,
  });
};
