import { PrismaClient } from '@/generated/prisma'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const client = global.prisma || new PrismaClient()

// In development, this prevents hot-reloading from creating new clients.
// In production, this ensures a single client is used across serverless function invocations.
if (process.env.NODE_ENV === 'development') {
  global.prisma = client
}

export default client
