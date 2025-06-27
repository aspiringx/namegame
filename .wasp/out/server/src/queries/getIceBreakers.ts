import { prisma } from 'wasp/server'

import { getIceBreakers } from '../../../../../src/queries'


export default async function (args, context) {
  return (getIceBreakers as any)(args, {
    ...context,
    entities: {
      IceBreaker: prisma.iceBreaker,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
