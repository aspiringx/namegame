import { JobHandler } from '@namegame/queue'
import { PrismaClient } from '@namegame/db'
import { Resend } from 'resend'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()
const resend = new Resend(process.env.RESEND_API_KEY)

interface SendVerificationEmailPayload {
  email: string
  userId: string
  firstName?: string
}

/**
 * Generate email verification token
 * (Copied from web app to avoid circular dependencies)
 */
async function generateEmailVerificationToken(userId: string) {
  const token = nanoid()
  const expires = new Date(new Date().getTime() + 3600 * 1000) // 1 hour

  const existingToken = await prisma.emailVerificationToken.findFirst({
    where: { userId },
  })

  if (existingToken) {
    await prisma.emailVerificationToken.delete({
      where: { id: existingToken.id },
    })
  }

  const verificationToken = await prisma.emailVerificationToken.create({
    data: {
      userId,
      token,
      expires,
    },
  })

  return verificationToken
}

/**
 * Verification email template (inline to avoid importing React components)
 */
function getVerificationEmailHtml(confirmLink: string, firstName?: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <p style="font-size: 14px; line-height: 24px;">Hi ${
            firstName || ''
          },</p>
          <p style="font-size: 14px; line-height: 24px;">
            You've joined a Relation Star group! Please click this link to verify your email address and unlock features.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmLink}" style="background-color: #4CAF50; color: #fff; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold; display: inline-block;">
              Verify Email
            </a>
          </div>
          <p style="font-size: 14px; line-height: 24px; background-color: #fef3c7; padding: 12px; font-weight: bold;">
            NOTICE: Be sure to open this link in the same browser you used to save this email address in your Relation Star user profile.
          </p>
          <p style="font-size: 14px; line-height: 24px;">
            If you did not sign up for Relation Star, please ignore this email.
          </p>
        </div>
      </body>
    </html>
  `
}

function getVerificationEmailText(confirmLink: string, firstName?: string) {
  return `
Hi ${firstName || ''},

Thanks for signing up for Relation Star! Please verify your email address by visiting this link:
${confirmLink}

NOTICE: Be sure to open this link in the same browser you used to save
this email address in your Relation Star user profile.

If you did not sign up for Relation Star, please ignore this email.

${new Date().getFullYear()} Relation Star
  `
}

/**
 * Send verification email job handler
 *
 * Sends email verification link to user asynchronously
 */
export const sendVerificationEmail: JobHandler<
  SendVerificationEmailPayload
> = async (payload) => {
  console.log(
    '[Job:send-verification-email] Processing verification email job',
    {
      email: payload.email,
      userId: payload.userId,
    },
  )

  const domain = process.env.NEXT_PUBLIC_APP_URL
  const from_no_reply =
    process.env.FROM_EMAIL_NO_REPLY || 'Relation Star <onboarding@resend.dev>'

  if (!domain) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required')
  }

  // Generate verification token
  const verificationToken = await generateEmailVerificationToken(payload.userId)
  const confirmLink = `${domain}/verify-email?token=${verificationToken.token}`

  // Send email via Resend
  await resend.emails.send({
    from: from_no_reply,
    to: payload.email,
    subject: 'Confirm your Relation Star email address',
    html: getVerificationEmailHtml(confirmLink, payload.firstName),
    text: getVerificationEmailText(confirmLink, payload.firstName),
  })

  console.log(
    '[Job:send-verification-email] Verification email sent successfully',
    {
      email: payload.email,
    },
  )
}
