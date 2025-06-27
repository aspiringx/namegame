import { prisma } from 'wasp/server'

import { getMessages } from '../../../../../src/queries'


export default async function (args, context) {
  return (getMessages as any)(args, {
    ...context,
    entities: {
      Message: prisma.message,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
