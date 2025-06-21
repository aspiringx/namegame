import { prisma } from 'wasp/server'

import { getPhotos } from '../../../../../src/queries'


export default async function (args, context) {
  return (getPhotos as any)(args, {
    ...context,
    entities: {
      Photo: prisma.photo,
      User: prisma.user,
      Group: prisma.group,
    },
  })
}
