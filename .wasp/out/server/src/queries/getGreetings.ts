import { prisma } from 'wasp/server'

import { getGreetings } from '../../../../../src/queries'


export default async function (args, context) {
  return (getGreetings as any)(args, {
    ...context,
    entities: {
      Greeting: prisma.greeting,
      UserUser: prisma.userUser,
    },
  })
}
