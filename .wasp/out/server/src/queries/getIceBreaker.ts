import { prisma } from 'wasp/server'

import { getIceBreaker } from '../../../../../src/queries'


export default async function (args, context) {
  return (getIceBreaker as any)(args, {
    ...context,
    entities: {
      IceBreaker: prisma.iceBreaker,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
