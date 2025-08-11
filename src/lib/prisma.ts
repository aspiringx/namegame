import { PrismaClient } from '@/generated/prisma'
import { withAccelerate } from '@prisma/extension-accelerate'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const client = global.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = client

export default client.$extends(withAccelerate()) as unknown as PrismaClient


