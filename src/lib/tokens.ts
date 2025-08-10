import { v4 as uuidv4 } from 'uuid'
import prisma from '@/lib/prisma'

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4()
  const expires = new Date(new Date().getTime() + 3600 * 1000) // 1 hour

  const existingToken = await prisma.passwordResetToken.findFirst({
    where: { email },
  })

  if (existingToken) {
    await prisma.passwordResetToken.delete({
      where: { id: existingToken.id },
    })
  }

  const passwordResetToken = await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  })

  return passwordResetToken
}

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
    })

    return passwordResetToken
  } catch {
    return null
  }
}

export const getEmailVerificationTokenByToken = async (token: string) => {
  try {
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
    })

    return verificationToken
  } catch {
    return null
  }
}

export const generateEmailVerificationToken = async (userId: string) => {
  const token = uuidv4()
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
