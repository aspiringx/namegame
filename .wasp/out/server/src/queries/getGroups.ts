import { prisma } from 'wasp/server'

import { getGroups } from '../../../../../src/queries'


export default async function (args, context) {
  return (getGroups as any)(args, {
    ...context,
    entities: {
      Group: prisma.group,
    },
  })
}
