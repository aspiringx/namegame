import { prisma } from 'wasp/server'

import { getLink } from '../../../../../src/queries'


export default async function (args, context) {
  return (getLink as any)(args, {
    ...context,
    entities: {
      Link: prisma.link,
      Group: prisma.group,
    },
  })
}
