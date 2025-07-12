import { PrismaClient } from '@/generated/prisma';

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient();
  }
  prisma = global.prisma;
}

// Standard client for general use and for the Auth.js adapter
export default prisma;

// Extended client for Next.js data caching features.
export const prismaWithCaching = prisma.$extends({});


