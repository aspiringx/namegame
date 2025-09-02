import 'server-only'

import { cache } from 'react'

import prisma from './prisma'

/**
 * Fetches all records from a given code table (e.g., 'photoType', 'entityType')
 * and returns them as a keyed object for easy lookups.
 * The result is cached per-request.
 *
 * @example
 * const photoTypes = await getCodeTable('photoType');
 * const primaryTypeId = photoTypes.primary.id;
 */
export const getCodeTable = cache(
  async (
    tableName:
      | 'photoType'
      | 'entityType'
      | 'groupUserRole'
      | 'userUserRelationType'
      | 'groupType',
  ): Promise<Record<string, { id: number; code: string }>> => {
    const results = await (prisma as any)[tableName].findMany({
      select: { id: true, code: true },
    })

    return results.reduce(
      (
        acc: Record<string, { id: number; code: string }>,
        item: { id: number; code: string },
      ) => {
        acc[item.code] = item
        return acc
      },
      {},
    )
  },
)
