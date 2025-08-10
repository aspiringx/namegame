'use server'

import prisma from '@/lib/prisma'
import { cache } from 'react'

/**
 * Fetches a group by its slug, including only the groupType.
 * This is a lightweight query used for routing between different group page layouts.
 */
export const getGroupTypeBySlug = cache(async (slug: string) => {
  const group = await prisma.group.findUnique({
    where: {
      slug,
    },
    select: {
      id: true,
      name: true, // Also useful for metadata/layout
      slug: true,
      groupType: {
        select: {
          code: true,
        },
      },
    },
  })
  return group
})
