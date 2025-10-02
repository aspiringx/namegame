import { Gender, type User } from '../generated/prisma'
import { FullRelationship, MemberWithUser, UserWithPhotoUrl } from '@/types'

/**
 * Represents the graph of family relationships as an adjacency list.
 * The key is a user's ID.
 * The value is an array of objects, each representing a directed edge to another user
 * and the type of relationship (e.g., 'parent', 'spouse').
 */
export type AdjacencyList = Map<
  string,
  { relatedUserId: string; type: string }[]
>

/**
 * Represents an item in the queue for the Breadth-First Search (BFS) algorithm.
 */
type BfsQueueItem = {
  userId: string
  path: { userId: string; relationshipType: string | null }[]
}

/**
 * The main result object.
 */
export type RelationshipResult = {
  relationship: string | null
  path: BfsQueueItem['path'] | null
  steps: number
}

/**
 * Finds the relationship between two users within a given group.
 *
 * @param egoUserId - The ID of the user from whose perspective the relationship is calculated.
 * @param alterUserId - The ID of the user to whom the relationship is being determined.
 * @param allRelationships - An array of all UserUser relationships for the group.
 * @returns An object containing the relationship string and the path, or null if no relationship is found.
 */

export const buildAdjacencyList = (
  relationships: FullRelationship[],
  members: MemberWithUser[],
  _currentUser?: UserWithPhotoUrl,
): Map<
  string,
  { relatedUserId: string; type: 'parent' | 'child' | 'partner' | 'spouse' }[]
> => {
  const list: Map<
    string,
    { relatedUserId: string; type: 'parent' | 'child' | 'partner' | 'spouse' }[]
  > = new Map()

  const addEdge = (
    from: string,
    to: string,
    type: 'parent' | 'child' | 'partner' | 'spouse',
  ) => {
    if (!list.has(from)) {
      list.set(from, [])
    }
    list.get(from)!.push({ relatedUserId: to, type })
  }

  // Process explicit parent-child relationships from the members array first
  for (const member of members) {
    if (member.parents) {
      for (const parent of member.parents) {
        addEdge(member.userId, parent.userId, 'parent')
        addEdge(parent.userId, member.userId, 'child')
      }
    }
    if (member.children) {
      for (const child of member.children) {
        addEdge(member.userId, child.userId, 'child')
        addEdge(child.userId, member.userId, 'parent')
      }
    }
  }

  // Process all relationships from the relationships array
  for (const rel of relationships) {
    if (rel.relationType.code === 'spouse') {
      addEdge(rel.user1Id, rel.user2Id, 'spouse')
      addEdge(rel.user2Id, rel.user1Id, 'spouse')
    } else if (rel.relationType.code === 'partner') {
      addEdge(rel.user1Id, rel.user2Id, 'partner')
      addEdge(rel.user2Id, rel.user1Id, 'partner')
    } else if (rel.relationType.code === 'parent') {
      // user1 is the parent of user2
      addEdge(rel.user2Id, rel.user1Id, 'parent')
      addEdge(rel.user1Id, rel.user2Id, 'child')
    } else if (rel.relationType.code === 'child') {
      // user1 is the child of user2
      addEdge(rel.user1Id, rel.user2Id, 'parent')
      addEdge(rel.user2Id, rel.user1Id, 'child')
    }
  }

  return list
}

/**
 * Finds the relationship between two users within a given group.
 *
 * @param egoUserId - The ID of the user from whose perspective the relationship is calculated.
 * @param alterUserId - The ID of the user to whom the relationship is being determined.
 * @param allRelationships - An array of all UserUser relationships for the group.
 * @returns An object containing the relationship string and the path, or null if no relationship is found.
 */
export function getRelationship(
  egoUserId: string,
  alterUserId: string,
  allRelationships: FullRelationship[],
  members: MemberWithUser[],
  usersMap: Map<string, User>,
  applyGender = true,
): RelationshipResult | null {
  // 1. Build the adjacency list from allRelationships
  const adjacencyList = buildAdjacencyList(allRelationships, members)

  // 2. Perform BFS to find the shortest path from ego to alter
  const queue: BfsQueueItem[] = [
    {
      userId: egoUserId,
      path: [{ userId: egoUserId, relationshipType: null }],
    },
  ]
  const visited = new Set<string>([egoUserId])

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    if (current.userId === alterUserId) {
      // Found the path! Now check for special cases like half-siblings.
      const pathString = current.path
        .slice(1)
        .map((p) => p.relationshipType)
        .join(' -> ')

      if (pathString === 'parent -> child') {
        const getParents = (userId: string): string[] => {
          const neighbors = adjacencyList.get(userId) || []
          return neighbors
            .filter((n) => n.type === 'parent')
            .map((n) => n.relatedUserId)
        }

        const egoParents = new Set(getParents(egoUserId))
        const alterParents = new Set(getParents(alterUserId))

        if (egoParents.size === 0 || alterParents.size === 0) {
          // Not enough information to determine, proceed to default
        } else if (egoParents.size === alterParents.size) {
          const parentsMatch = [...alterParents].every((p) => egoParents.has(p))
          if (parentsMatch) {
            return {
              relationship: getGenderedLabel(
                'Sibling',
                usersMap.get(alterUserId)?.gender,
                applyGender,
              ),
              path: current.path,
              steps: current.path.length - 1,
            }
          }
        }

        // Fallback to half-sibling if parents don't perfectly match but share at least one
        const commonParents = [...alterParents].filter((p) => egoParents.has(p))

        if (commonParents.length > 0) {
          return {
            relationship: getGenderedLabel(
              'Half-sibling',
              usersMap.get(alterUserId)?.gender,
              applyGender,
            ),
            path: current.path,
            steps: current.path.length - 1,
          }
        }
      } else {
        // If not a special case, translate the path normally.
        const relationship = translatePathToRelationship(
          current.path,
          usersMap,
          applyGender,
        )
        return {
          relationship,
          path: current.path,
          steps: current.path.length - 1,
        }
      }
    }

    const neighbors = adjacencyList.get(current.userId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.relatedUserId)) {
        visited.add(neighbor.relatedUserId)
        const newPath = [
          ...current.path,
          { userId: neighbor.relatedUserId, relationshipType: neighbor.type },
        ]
        queue.push({ userId: neighbor.relatedUserId, path: newPath })
      }
    }
  }

  // 3. Translate the path into a human-readable relationship string

  return null // No path found
}

function getGenderedLabel(
  base: string,
  gender: Gender | null | undefined,
  applyGender: boolean,
): string {
  if (applyGender) {
    if (gender === 'male') {
      const maleMap: Record<string, string> = {
        'Child-in-law': 'Son-in-law',
        'Co-child': 'Co-son',
        'Co-grandchild': 'Co-grandson',
        'Co-grandparent': 'Co-grandfather',
        'Co-great-grandchild': 'Co-great-grandson',
        'Co-great-grandparent': 'Co-great-grandfather',
        'Co-great-great-grandchild': 'Co-great-great-grandson',
        'Co-great-great-grandparent': 'Co-great-great-grandfather',
        'Co-great-nibling': 'Co-great-nephew',
        'Co-great-pibling': 'Co-great-uncle',
        'Co-nibling': 'Co-nephew',
        'Co-parent': 'Co-father',
        'Co-pibling': 'Co-uncle',
        'Co-sibling': 'Co-brother',
        'Grandchild-in-law': 'Grandson-in-law',
        'Grandparent-in-law': 'Grandfather-in-law',
        'Great-grandchild': 'Great-grandson',
        'Great-grandchild-in-law': 'Great-grandson-in-law',
        'Great-grandparent': 'Great-grandfather',
        'Great-grandparent-in-law': 'Great-grandfather-in-law',
        'Great-great-grandchild': 'Great-great-grandson',
        'Great-great-grandchild-in-law': 'Great-great-grandson-in-law',
        'Great-great-grandparent': 'Great-great-grandfather',
        'Great-great-grandparent-in-law': 'Great-great-grandfather-in-law',
        'Great-great-nibling': 'Great-great-nephew',
        'Great-great-nibling-in-law': 'Great-great-nephew-in-law',
        'Great-great-pibling': 'Great-great-uncle',
        'Great-great-pibling-in-law': 'Great-great-uncle-in-law',
        'Great-nibling': 'Great-nephew',
        'Great-nibling-in-law': 'Great-nephew-in-law',
        'Great-pibling': 'Great-uncle',
        'Great-pibling-in-law': 'Great-uncle-in-law',
        'Half-sibling': 'Half-brother',
        'Parent-in-law': 'Father-in-law',
        'Sibling-in-law': 'Brother-in-law',
        'Step-child': 'Step-son',
        'Step-grandchild': 'Step-grandson',
        'Step-grandparent': 'Step-grandfather',
        'Step-great-grandchild': 'Step-great-grandson',
        'Step-great-grandparent': 'Step-great-grandfather',
        'Step-great-nibling': 'Step-great-nephew',
        'Step-great-pibling': 'Step-great-uncle',
        'Step-great-great-grandchild': 'Step-great-great-grandson',
        'Step-great-great-grandparent': 'Step-great-great-grandfather',
        'Step-great-great-nibling': 'Step-great-great-nephew',
        'Step-great-great-pibling': 'Step-great-great-uncle',
        'Step-nibling': 'Step-nephew',
        'Step-parent': 'Step-father',
        'Step-pibling': 'Step-uncle',
        'Step-sibling': 'Step-brother',
        Child: 'Son',
        Grandchild: 'Grandson',
        Grandparent: 'Grandfather',
        Nibling: 'Nephew',
        Parent: 'Father',
        Pibling: 'Uncle',
        Sibling: 'Brother',
        Spouse: 'Husband',
      }
      // Handle compound cases like 'Grandparent'
      for (const key in maleMap) {
        if (base.includes(key)) {
          return base.replace(key, maleMap[key])
        }
      }
    }
    if (gender === 'female') {
      const femaleMap: Record<string, string> = {
        'Child-in-law': 'Daughter-in-law',
        'Co-child': 'Co-daughter',
        'Co-grandchild': 'Co-granddaughter',
        'Co-grandparent': 'Co-grandmother',
        'Co-great-grandchild': 'Co-great-granddaughter',
        'Co-great-grandparent': 'Co-great-grandmother',
        'Co-great-great-grandchild': 'Co-great-great-granddaughter',
        'Co-great-great-grandparent': 'Co-great-great-grandmother',
        'Co-great-nibling': 'Co-great-niece',
        'Co-great-pibling': 'Co-great-aunt',
        'Co-nibling': 'Co-niece',
        'Co-parent': 'Co-mother',
        'Co-pibling': 'Co-aunt',
        'Co-sibling': 'Co-sister',
        'Grandchild-in-law': 'Granddaughter-in-law',
        'Grandparent-in-law': 'Grandmother-in-law',
        'Great-grandchild': 'Great-granddaughter',
        'Great-grandchild-in-law': 'Great-granddaughter-in-law',
        'Great-grandparent': 'Great-grandmother',
        'Great-grandparent-in-law': 'Great-grandmother-in-law',
        'Great-great-grandchild': 'Great-great-granddaughter',
        'Great-great-grandchild-in-law': 'Great-great-granddaughter-in-law',
        'Great-great-grandparent': 'Great-great-grandmother',
        'Great-great-grandparent-in-law': 'Great-great-grandmother-in-law',
        'Great-great-nibling': 'Great-great-niece',
        'Great-great-nibling-in-law': 'Great-great-niece-in-law',
        'Great-great-pibling': 'Great-great-aunt',
        'Great-great-pibling-in-law': 'Great-great-aunt-in-law',
        'Great-nibling': 'Great-niece',
        'Great-nibling-in-law': 'Great-niece-in-law',
        'Great-pibling': 'Great-aunt',
        'Great-pibling-in-law': 'Great-aunt-in-law',
        'Half-sibling': 'Half-sister',
        'Parent-in-law': 'Mother-in-law',
        'Sibling-in-law': 'Sister-in-law',
        'Step-child': 'Step-daughter',
        'Step-grandchild': 'Step-granddaughter',
        'Step-grandparent': 'Step-grandmother',
        'Step-great-grandchild': 'Step-great-granddaughter',
        'Step-great-grandparent': 'Step-great-grandmother',
        'Step-great-nibling': 'Step-great-niece',
        'Step-great-pibling': 'Step-great-aunt',
        'Step-great-great-grandchild': 'Step-great-great-granddaughter',
        'Step-great-great-grandparent': 'Step-great-great-grandmother',
        'Step-great-great-nibling': 'Step-great-great-niece',
        'Step-great-great-pibling': 'Step-great-great-aunt',
        'Step-nibling': 'Step-niece',
        'Step-parent': 'Step-mother',
        'Step-pibling': 'Step-aunt',
        'Step-sibling': 'Step-sister',
        Child: 'Daughter',
        Grandchild: 'Granddaughter',
        Grandparent: 'Grandmother',
        Nibling: 'Niece',
        Parent: 'Mother',
        Pibling: 'Aunt',
        Sibling: 'Sister',
        Spouse: 'Wife',
      }
      for (const key in femaleMap) {
        if (base.includes(key)) {
          return base.replace(key, femaleMap[key])
        }
      }
    }
  }
  return base
}

/**
 * Translates a path into a human-readable relationship string.
 *
 * @param path - The path to translate.
 * @param usersMap - A map of user IDs to User objects.
 * @param applyGender - Whether to apply gender to the relationship label.
 * @returns The translated relationship string, or null if the path is invalid.
 */
export function translatePathToRelationship(
  path: BfsQueueItem['path'],
  usersMap: Map<string, User>,
  applyGender = true,
): string | null {
  const pathLength = path.length
  if (pathLength <= 1) return null

  const relationships = path.slice(1).map((p) => p.relationshipType)
  const pathString = relationships.join(' > ')

  const relationshipRules: {
    path: string
    label: string
    genderedOn?: number
  }[] = [
    { path: 'child', label: 'Child', genderedOn: 2 },
    { path: 'parent', label: 'Parent', genderedOn: 2 },
    { path: 'spouse', label: 'Spouse', genderedOn: 2 },
    { path: 'child > child', label: 'Grandchild', genderedOn: 2 },
    { path: 'parent > parent', label: 'Grandparent', genderedOn: 2 },
    { path: 'child > child > child', label: 'Great-grandchild', genderedOn: 3 },
    {
      path: 'parent > parent > parent',
      label: 'Great-grandparent',
      genderedOn: 3,
    },
    { path: 'parent > child > child', label: 'Nibling', genderedOn: 3 },
    { path: 'parent > parent > child', label: 'Pibling', genderedOn: 3 },
    { path: 'parent > parent > child > child', label: 'Cousin' },
    {
      path: 'child > child > child > child',
      label: 'Great-great-grandchild',
      genderedOn: 4,
    },
    {
      path: 'parent > parent > parent > parent',
      label: 'Great-great-grandparent',
      genderedOn: 4,
    },
    {
      path: 'parent > child > child > child',
      label: 'Great-nibling',
      genderedOn: 4,
    },
    {
      path: 'parent > parent > parent > child',
      label: 'Great-pibling',
      genderedOn: 4,
    },
    {
      path: 'parent > parent > child > child > child',
      label: '1st cousin-once-removed',
    },
    {
      path: 'parent > parent > parent > child > child',
      label: '1st cousin-once-removed',
    },
    {
      path: 'parent > child > child > child > child',
      label: 'Great-great-nibling',
      genderedOn: 5,
    },
    {
      path: 'parent > parent > parent > parent > child',
      label: 'Great-great-pibling',
      genderedOn: 5,
    },
    {
      path: 'parent > spouse > parent > parent > parent > child',
      label: 'Step-great-great-pibling',
      genderedOn: 6,
    },
    {
      path: 'parent > spouse > parent > child > child',
      label: 'Step-cousin',
    },
    {
      path: 'parent > parent > parent > child > spouse > child',
      label: 'Step-1st cousin-once-removed',
    },
    {
      path: 'parent > child > spouse > child > child > child',
      label: 'Step-great-great-nibling',
      genderedOn: 6,
    },
    {
      path: 'parent > parent > parent > child > child > spouse > child',
      label: 'Step-2nd cousin',
    },
    { path: 'child > spouse', label: 'Child-in-law', genderedOn: 2 },
    { path: 'spouse > parent', label: 'Parent-in-law', genderedOn: 2 },
    {
      path: 'spouse > parent > parent',
      label: 'Grandparent-in-law',
      genderedOn: 3,
    },
    {
      path: 'spouse > parent > child',
      label: 'Sibling-in-law',
      genderedOn: 3,
    },
    {
      path: 'parent > child > spouse',
      label: 'Sibling-in-law',
      genderedOn: 3,
    },
    {
      path: 'spouse > parent > child > spouse',
      label: 'Sibling-in-law',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > parent > parent',
      label: 'Great-grandparent-in-law',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > child > child',
      label: 'Nibling-in-law',
      genderedOn: 4,
    },
    {
      path: 'parent > parent > child > spouse',
      label: 'Pibling-in-law',
      genderedOn: 4,
    },
    {
      path: 'parent > child > child > spouse',
      label: 'Co-nibling',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > parent > child',
      label: 'Pibling-in-law',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > parent > child > child',
      label: 'Cousin-in-law',
    },
    {
      path: 'parent > parent > child > child > spouse',
      label: 'Cousin-in-law',
    },
    {
      path: 'spouse > parent > parent > parent > parent',
      label: 'Great-great-grandparent-in-law',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > child > child > child',
      label: 'Great-nibling-in-law',
      genderedOn: 5,
    },
    {
      path: 'parent > parent > parent > child > spouse',
      label: 'Great-pibling-in-law',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > parent > child > spouse',
      label: 'Pibling-in-law',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > parent > child > child > child',
      label: '1st cousin-once-removed-in-law',
    },
    {
      path: 'spouse > parent > parent > parent > child > child',
      label: '1st cousin-once-removed-in-law',
    },
    {
      path: 'parent > parent > parent > child > child > spouse',
      label: '1st cousin-once-removed-in-law',
    },
    {
      path: 'spouse > parent > child > child > child > child',
      label: 'Great-great-nibling-in-law',
      genderedOn: 6,
    },
    {
      path: 'parent > parent > parent > parent > child > spouse',
      label: 'Great-great-pibling-in-law',
      genderedOn: 6,
    },
    {
      path: 'spouse > parent > parent > parent > child > child > spouse',
      label: '1st cousin-once-removed-in-law',
    },
    {
      path: 'spouse > parent > parent > parent > child > child > child',
      label: '2nd cousin-in-law',
    },
    { path: 'spouse > child', label: 'Step-child', genderedOn: 2 },
    { path: 'parent > spouse', label: 'Step-parent', genderedOn: 2 },
    {
      path: 'spouse > child > child',
      label: 'Step-grandchild',
      genderedOn: 3,
    },
    {
      path: 'parent > spouse > parent',
      label: 'Step-grandparent',
      genderedOn: 3,
    },
    { path: 'parent > spouse > child', label: 'Step-sibling', genderedOn: 3 },
    {
      path: 'spouse > child > child > child',
      label: 'Step-great-grandchild',
      genderedOn: 4,
    },
    {
      path: 'parent > spouse > parent > parent',
      label: 'Step-great-grandparent',
      genderedOn: 4,
    },
    {
      path: 'parent > child > spouse > child',
      label: 'Step-nibling',
      genderedOn: 4,
    },
    {
      path: 'parent > spouse > parent > child',
      label: 'Step-pibling',
      genderedOn: 4,
    },
    {
      path: 'spouse > child > child > child > child',
      label: 'Step-great-great-grandchild',
      genderedOn: 5,
    },
    {
      path: 'parent > spouse > parent > parent > parent',
      label: 'Step-great-great-grandparent',
      genderedOn: 5,
    },
    {
      path: 'parent > child > spouse > child > child',
      label: 'Step-great-nibling',
      genderedOn: 5,
    },
    {
      path: 'parent > spouse > parent > parent > child',
      label: 'Step-great-pibling',
      genderedOn: 5,
    },
    {
      path: 'parent > spouse > parent > child > child > child',
      label: 'Step-1st cousin-once-removed',
    },
    {
      path: 'parent > spouse > parent > parent > child > child',
      label: 'Step-1st cousin-once-removed',
    },

    // --- Co-relationships (via spouse) ---
    { path: 'spouse', label: 'Spouse', genderedOn: 2 },
    { path: 'spouse > child', label: 'Co-child', genderedOn: 2 },
    { path: 'parent > spouse', label: 'Co-parent', genderedOn: 2 },
    { path: 'spouse > parent', label: 'Co-parent', genderedOn: 2 },
    { path: 'spouse > child > child', label: 'Co-grandchild', genderedOn: 3 },
    {
      path: 'parent > spouse > parent',
      label: 'Co-grandparent',
      genderedOn: 3,
    },
    {
      path: 'spouse > parent > parent',
      label: 'Co-grandparent',
      genderedOn: 3,
    },
    { path: 'parent > spouse > child', label: 'Co-sibling', genderedOn: 3 },
    { path: 'spouse > parent > child', label: 'Co-sibling', genderedOn: 3 },
    {
      path: 'spouse > child > child > child',
      label: 'Co-great-grandchild',
      genderedOn: 4,
    },
    {
      path: 'parent > spouse > parent > parent',
      label: 'Co-great-grandparent',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > parent > parent',
      label: 'Co-great-grandparent',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > child > child',
      label: 'Co-nibling',
      genderedOn: 4,
    },
    {
      path: 'parent > child > spouse > child',
      label: 'Co-nibling',
      genderedOn: 4,
    },
    {
      path: 'parent > spouse > parent > child',
      label: 'Co-pibling',
      genderedOn: 4,
    },
    {
      path: 'spouse > parent > parent > child',
      label: 'Co-pibling',
      genderedOn: 4,
    },
    { path: 'spouse > parent > parent > child > child', label: 'Co-cousin' },
    {
      path: 'spouse > child > child > child > child',
      label: 'Co-great-great-grandchild',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > child > child > child',
      label: 'Co-great-nibling',
      genderedOn: 5,
    },
    {
      path: 'parent > child > child > spouse > child',
      label: 'Co-great-nibling',
      genderedOn: 5,
    },
    {
      path: 'parent > spouse > parent > parent > child',
      label: 'Co-great-pibling',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > parent > parent > child',
      label: 'Co-great-pibling',
      genderedOn: 5,
    },
    {
      path: 'spouse > parent > parent > child > child > child',
      label: 'Co-1st cousin-once-removed',
    },
    {
      path: 'spouse > parent > parent > parent > child > child',
      label: 'Co-1st cousin-once-removed',
    },
    {
      path: 'parent > parent > parent > child > child > spouse',
      label: 'Co-1st cousin-once-removed',
    },
    {
      path: 'parent > parent > parent > child > child > child',
      label: '2nd cousin',
    },
    {
      path: 'parent > spouse > parent > parent > child > child > child',
      label: 'Step-2nd cousin',
    },
    {
      path: 'parent > parent > child > child > spouse > child',
      label: 'Co-1st cousin-once-removed',
    },
    {
      path: 'spouse > parent > parent > parent > child > child > child',
      label: 'Co-2nd cousin',
    },
    {
      path: 'parent > parent > parent > child > child > child > spouse',
      label: 'Co-2nd cousin',
    },
  ]

  const matchedRule = relationshipRules.find((rule) => rule.path === pathString)

  if (matchedRule) {
    if (applyGender && matchedRule.genderedOn) {
      const genderedUser = usersMap.get(path[path.length - 1].userId)
      return getGenderedLabel(
        matchedRule.label,
        genderedUser?.gender,
        applyGender,
      )
    }
    return matchedRule.label
  }

  return 'Relative'
}
