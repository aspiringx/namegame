import { prisma } from 'wasp/server'

import { getMessage } from '../../../../../src/queries'


export default async function (args, context) {
  return (getMessage as any)(args, {
    ...context,
    entities: {
      Message: prisma.message,
      User: prisma.user,
    },
  })
}
