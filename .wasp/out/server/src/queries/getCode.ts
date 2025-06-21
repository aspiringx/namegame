import { prisma } from 'wasp/server'

import { getCode } from '../../../../../src/queries'


export default async function (args, context) {
  return (getCode as any)(args, {
    ...context,
    entities: {
      Code: prisma.code,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
