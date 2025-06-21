import { prisma } from 'wasp/server'

import { getPhoto } from '../../../../../src/queries'


export default async function (args, context) {
  return (getPhoto as any)(args, {
    ...context,
    entities: {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
