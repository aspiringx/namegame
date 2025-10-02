import { describe, it, expect, beforeAll } from 'vitest'
import {
  PrismaClient,
  User,
} from '../generated/prisma'
import { MemberWithUser } from '@/types'
import { getRelationship } from './family-tree'
import { FullRelationship } from '../types'

const prisma = new PrismaClient()

describe('getRelationship with seeded data', () => {
  let allUsers: User[]
  let allRelationships: FullRelationship[]
  let egoUser: User
  let usersMap: Map<string, User>
  let members: MemberWithUser[]

  beforeAll(async () => {
    // 1. Fetch all data from the test database
    // 1. Fetch all data from the test database
    const group = await prisma.group.findUnique({
      where: { slug: 'test-family' },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!group) {
      throw new Error('Test data not found. Make sure to run the seeder first.')
    }

    members = group.members as MemberWithUser[]
    allUsers = members.map((m) => m.user)
    const userIds = new Set(allUsers.map((u) => u.id))

    const allDbRelationships = await prisma.userUser.findMany({
      include: { relationType: true },
    })

    // Filter relationships to only include those between members of the fetched group
    allRelationships = allDbRelationships.filter(
      (r) => userIds.has(r.user1Id) && userIds.has(r.user2Id),
    ) as FullRelationship[]

    usersMap = new Map<string, User>()
    allUsers.forEach((user) => usersMap.set(user.id, user))

    egoUser = allUsers.find((u) => u.firstName === 'Ego')!
    if (!egoUser) {
      throw new Error('Ego user not found in the seeded data.')
    }
  })

  const relationshipPaths = [
    { label: 'Child', path: 'child' },
    { label: 'Parent', path: 'parent' },
    { label: 'Spouse', path: 'spouse' },
    { label: 'Grandchild', path: 'child > child' },
    { label: 'Grandparent', path: 'parent > parent' },
    { label: 'Sibling', path: 'parent > child' },
    { label: 'Great-grandchild', path: 'child > child > child' },
    { label: 'Great-grandparent', path: 'parent > parent > parent' },
    { label: 'Nibling', path: 'parent > child > child' },
    { label: 'Pibling', path: 'parent > parent > child' },
    { label: 'Cousin', path: 'parent > parent > child > child' },
    { label: 'Great-great-grandchild', path: 'child > child > child > child' },
    {
      label: 'Great-great-grandparent',
      path: 'parent > parent > parent > parent',
    },
    { label: 'Great-nibling', path: 'parent > child > child > child' },
    { label: 'Great-pibling', path: 'parent > parent > parent > child' },
    {
      label: '1st cousin-once-removed',
      path: 'parent > parent > child > child > child',
    },
    {
      label: '1st cousin-once-removed',
      path: 'parent > parent > parent > child > child',
    },
    {
      label: 'Great-great-nibling',
      path: 'parent > child > child > child > child',
    },
    {
      label: 'Great-great-pibling',
      path: 'parent > parent > parent > parent > child',
    },
    {
      label: '2nd cousin',
      path: 'parent > parent > parent > child > child > child',
    },
    { label: 'Child-in-law', path: 'child > spouse' },
    { label: 'Parent-in-law', path: 'spouse > parent' },
    { label: 'Grandparent-in-law', path: 'spouse > parent > parent' },
    { label: 'Sibling-in-law', path: 'spouse > parent > child' },
    {
      label: 'Great-grandparent-in-law',
      path: 'spouse > parent > parent > parent',
    },
    { label: 'Nibling-in-law', path: 'spouse > parent > child > child' },
    { label: 'Pibling-in-law', path: 'parent > parent > child > spouse' },
    { label: 'Pibling-in-law', path: 'spouse > parent > parent > child' },
    {
      label: 'Cousin-in-law',
      path: 'spouse > parent > parent > child > child',
    },
    {
      label: 'Great-great-grandparent-in-law',
      path: 'spouse > parent > parent > parent > parent',
    },
    {
      label: 'Great-nibling-in-law',
      path: 'spouse > parent > child > child > child',
    },
    {
      label: 'Great-pibling-in-law',
      path: 'parent > parent > parent > child > spouse',
    },
    {
      label: 'Pibling-in-law',
      path: 'spouse > parent > parent > child > spouse',
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > child > child > child',
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > parent > child > child',
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'parent > parent > parent > child > child > spouse',
    },
    {
      label: 'Great-great-nibling-in-law',
      path: 'spouse > parent > child > child > child > child',
    },
    {
      label: 'Great-great-pibling-in-law',
      path: 'parent > parent > parent > parent > child > spouse',
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > parent > child > child > spouse',
    },
    {
      label: '2nd cousin-in-law',
      path: 'spouse > parent > parent > parent > child > child > child',
    },
    { label: 'Step-child', path: 'spouse > child' },
    { label: 'Step-parent', path: 'parent > spouse' },
    { label: 'Step-grandchild', path: 'spouse > child > child' },
    { label: 'Step-grandparent', path: 'parent > spouse > parent' },
    { label: 'Step-sibling', path: 'parent > spouse > child' },
    { label: 'Step-great-grandchild', path: 'spouse > child > child > child' },
    {
      label: 'Step-great-grandparent',
      path: 'parent > spouse > parent > parent',
    },
    { label: 'Step-nibling', path: 'parent > child > spouse > child' },
    { label: 'Step-pibling', path: 'parent > spouse > parent > child' },
    {
      label: 'Step-great-great-grandchild',
      path: 'spouse > child > child > child > child',
    },
    {
      label: 'Step-great-great-grandparent',
      path: 'parent > spouse > parent > parent > parent',
    },
    {
      label: 'Step-great-nibling',
      path: 'parent > child > spouse > child > child',
    },
    {
      label: 'Step-great-pibling',
      path: 'parent > spouse > parent > parent > child',
    },
    {
      label: 'Step-cousin',
      path: 'parent > spouse > parent > child > child',
    },

    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > spouse > parent > child > child > child',
    },
    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > spouse > parent > parent > child > child',
    },
    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > parent > parent > child > spouse > child',
    },

    {
      label: 'Step-great-great-nibling',
      path: 'parent > child > spouse > child > child > child',
    },
    {
      label: 'Step-great-great-pibling',
      path: 'parent > spouse > parent > parent > parent > child',
    },
    {
      label: 'Step-2nd cousin',
      path: 'parent > spouse > parent > parent > child > child > child',
    },
    {
      label: 'Step-2nd cousin',
      path: 'parent > parent > parent > child > child > spouse > child',
    },
    { label: 'Partner', path: 'partner' },
    { label: 'Co-child', path: 'partner > child' },
    { label: 'Co-parent', path: 'parent > partner' },
    { label: 'Co-parent', path: 'partner > parent' },
    { label: 'Co-grandchild', path: 'partner > child > child' },
    { label: 'Co-grandparent', path: 'parent > partner > parent' },
    { label: 'Co-grandparent', path: 'partner > parent > parent' },
    { label: 'Co-sibling', path: 'parent > partner > child' },
    { label: 'Co-sibling', path: 'partner > parent > child' },
    { label: 'Co-great-grandchild', path: 'partner > child > child > child' },
    {
      label: 'Co-great-grandparent',
      path: 'parent > partner > parent > parent',
    },
    {
      label: 'Co-great-grandparent',
      path: 'partner > parent > parent > parent',
    },
    { label: 'Co-nibling', path: 'partner > parent > child > child' },
    { label: 'Co-nibling', path: 'parent > child > partner > child' },
    { label: 'Co-pibling', path: 'parent > partner > parent > child' },
    { label: 'Co-pibling', path: 'partner > parent > parent > child' },
    { label: 'Co-cousin', path: 'partner > parent > parent > child > child' },
    {
      label: 'Co-great-great-grandchild',
      path: 'partner > child > child > child > child',
    },
    {
      label: 'Co-great-nibling',
      path: 'partner > parent > child > child > child',
    },
    {
      label: 'Co-great-nibling',
      path: 'parent > child > child > partner > child',
    },
    {
      label: 'Co-great-pibling',
      path: 'parent > partner > parent > parent > child',
    },
    {
      label: 'Co-great-pibling',
      path: 'partner > parent > parent > parent > child',
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'partner > parent > parent > child > child > child',
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'partner > parent > parent > parent > child > child',
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'parent > parent > parent > child > child > partner',
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'parent > parent > child > child > partner > child',
    },
    {
      label: 'Co-2nd cousin',
      path: 'partner > parent > parent > parent > child > child > child',
    },
    {
      label: 'Co-2nd cousin',
      path: 'parent > parent > parent > child > child > child > partner',
    },
  ]

  // Using .each to create a test for every path
  it.each(relationshipPaths)(
    'should correctly identify: $label ($path)',
    ({ label, path }) => {
      const normalizedPath = path
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/\s*>\s*/g, ' > ')
      const _normalizedLabel = label.replace(/\s+/g, ' ').trim()

      const alterName = `Ego > ${normalizedPath}`
      const alterUser = allUsers.find((u) => u.firstName === alterName)

      expect(
        alterUser,
        `User with name '${alterName}' not found. Check the seeder.`,
      ).toBeDefined()

      const result = getRelationship(
        egoUser.id,
        alterUser!.id,
        allRelationships,
        members,
        usersMap,
        false,
      )

      expect(
        result,
        `No relationship path found for ${label} (${path})`,
      ).not.toBeNull()
      expect(result?.relationship).toBe(label)
    },
  )
})
