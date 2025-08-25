import { resend } from '@/lib/resend'
import {
  VerificationEmail,
  getVerificationEmailText,
} from '@/emails/verification-email'
import { generateEmailVerificationToken } from '@/lib/tokens'
import {
  PasswordResetEmail,
  getPasswordResetEmailText,
} from '@/emails/password-reset-email'
import React from 'react'

const domain = process.env.NEXT_PUBLIC_APP_URL
const from_no_reply =
  process.env.FROM_EMAIL_NO_REPLY || 'NameGame <onboarding@resend.dev>'

export const sendVerificationEmail = async (
  email: string,
  userId: string,
  firstName?: string,
) => {
  const verificationToken = await generateEmailVerificationToken(userId)
  const confirmLink = `${domain}/verify-email?token=${verificationToken.token}`

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Confirm your NameGame email address',
    react: React.createElement(VerificationEmail, { confirmLink, firstName }),
    text: getVerificationEmailText(confirmLink, firstName),
  })
}

export const sendPasswordResetEmail = async (
  email: string,
  token: string,
  firstName?: string,
) => {
  const resetLink = `${domain}/reset/new-password?token=${token}`

  await resend.emails.send({
    from: from_no_reply,
    to: email,
    subject: 'Reset your password',
    react: React.createElement(PasswordResetEmail, { resetLink, firstName }),
    text: getPasswordResetEmailText(resetLink, firstName),
  })
}
