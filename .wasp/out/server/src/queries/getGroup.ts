import { prisma } from 'wasp/server'

import { getGroup } from '../../../../../src/queries'


export default async function (args, context) {
  return (getGroup as any)(args, {
    ...context,
    entities: {
      Group: prisma.group,
      User: prisma.user,
      GroupUser: prisma.groupUser,
      Photo: prisma.photo,
      Message: prisma.message,
      Link: prisma.link,
      IceBreaker: prisma.iceBreaker,
    },
  })
}
