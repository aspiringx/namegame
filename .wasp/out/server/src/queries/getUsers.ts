import { prisma } from 'wasp/server'

import { getUsers } from '../../../../../src/queries'


export default async function (args, context) {
  return (getUsers as any)(args, {
    ...context,
    entities: {
      User: prisma.user,
    },
  })
}
