import { prisma } from 'wasp/server'

import { getGreeting } from '../../../../../src/queries'


export default async function (args, context) {
  return (getGreeting as any)(args, {
    ...context,
    entities: {
      Greeting: prisma.greeting,
      User: prisma.user,
    },
  })
}
