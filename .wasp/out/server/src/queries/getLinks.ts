import { prisma } from 'wasp/server'

import { getLinks } from '../../../../../src/queries'


export default async function (args, context) {
  return (getLinks as any)(args, {
    ...context,
    entities: {
      Link: prisma.link,
      Group: prisma.group,
    },
  })
}
