import { PrismaClient } from '@namegame/db'

declare global {
  // allow global `var` declarations
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const client = global.prisma || new PrismaClient({
  // Increase transaction timeout to handle queued requests during high load
  // Default is 5000ms, increased to 15000ms (15 seconds)
  transactionOptions: {
    maxWait: 15000, // Max time to wait for a transaction slot (15s)
    timeout: 15000, // Max time for transaction to complete (15s)
  },
})

// In development, this prevents hot-reloading from creating new clients.
// In production, this ensures a single client is used across serverless function invocations.
if (process.env.NODE_ENV === 'development') {
  global.prisma = client
}

export default client
