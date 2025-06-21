import { prisma } from 'wasp/server'

import { getCodes } from '../../../../../src/queries'


export default async function (args, context) {
  return (getCodes as any)(args, {
    ...context,
    entities: {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
