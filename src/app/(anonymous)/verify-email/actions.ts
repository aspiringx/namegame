'use server'

import { auth } from '@/auth'
import prisma from '@/lib/prisma'
import { getEmailVerificationTokenByToken } from '@/lib/tokens'

export const verifyEmail = async (
  token: string,
): Promise<{ success: boolean; message: string; isAuthenticated: boolean }> => {
  const session = await auth()
  if (!token) {
    return {
      success: false,
      message: 'Missing verification token.',
      isAuthenticated: !!session,
    }
  }

  const verificationToken = await getEmailVerificationTokenByToken(token)

  if (!verificationToken) {
    return {
      success: false,
      message: 'Invalid or expired token.',
      isAuthenticated: !!session,
    }
  }

  const hasExpired = new Date(verificationToken.expires) < new Date()

  if (hasExpired) {
    return { success: false, message: 'Token has expired.', isAuthenticated: !!session }
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: verificationToken.userId },
  })

  if (!existingUser) {
    return { success: false, message: 'Invalid token.', isAuthenticated: !!session }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: new Date() },
      })

      await tx.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      })
    })

    return {
      success: true,
      message: 'Email verified successfully!',
      isAuthenticated: !!session,
    }
  } catch (error) {
    console.error('Error verifying email:', error)
    return {
      success: false,
      message: 'Database error. Please try again.',
      isAuthenticated: !!session,
    }
  }
}
