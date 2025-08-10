import { PrismaClient } from '@/generated/prisma'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // In production, use a global variable to preserve the client across module reloads.
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
} else {
  // In development, use a global variable to prevent creating multiple instances
  // during hot-reloading.
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

// Standard client for general use and for the Auth.js adapter
export default prisma

// Extended client for Next.js data caching features.
export const prismaWithCaching = prisma.$extends({})
