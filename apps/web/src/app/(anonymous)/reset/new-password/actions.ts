'use server'

import bcrypt from 'bcrypt'
import prisma from '@/lib/prisma'
import { getPasswordResetTokenByToken } from '@/lib/tokens'

export async function newPassword(
  password: string,
  token?: string | null,
): Promise<{ success?: string; error?: string }> {
  if (!token) {
    return { error: 'Missing token!' }
  }

  const existingToken = await getPasswordResetTokenByToken(token)

  if (!existingToken) {
    return { error: 'Invalid token!' }
  }

  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    return { error: 'Token has expired!' }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: existingToken.email },
  })

  if (!existingUser) {
    return { error: 'Email does not exist!' }
  }

  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/
  if (!passwordRegex.test(password)) {
    return {
      error:
        'Password must be at least 6 characters and include both letters and numbers.',
    }
  }

  if (password === 'password123') {
    return { error: 'Please choose a more secure password.' }
  }

  if (existingUser.password) {
    const isSamePassword = await bcrypt.compare(password, existingUser.password)
    if (isSamePassword) {
      return { error: 'New password cannot be the same as your current one.' }
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.update({
    where: { id: existingUser.id },
    data: { password: hashedPassword },
  })

  await prisma.passwordResetToken.delete({
    where: { id: existingToken.id },
  })

  return { success: 'Password updated!' }
}
