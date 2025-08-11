import { PrismaClient } from '@/generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prismaClientSingleton = () => {
  return new PrismaClient().$extends(withAccelerate())
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof prismaClientSingleton> | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Extended client for Next.js data caching features.
export const prismaWithCaching = prisma.$extends({})

