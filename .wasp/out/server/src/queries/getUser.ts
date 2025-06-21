import { prisma } from 'wasp/server'

import { getUser } from '../../../../../src/queries'


export default async function (args, context) {
  return (getUser as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
