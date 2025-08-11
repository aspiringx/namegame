import type { User } from '../generated/prisma'
import type { FullRelationship } from '@/types'

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

function buildAdjacencyList(relationships: FullRelationship[]): AdjacencyList {
  const list: AdjacencyList = new Map()

  const addEdge = (from: string, to: string, type: string) => {
    if (!list.has(from)) {
      list.set(from, [])
    }
    list.get(from)!.push({ relatedUserId: to, type })
  }

  for (const rel of relationships) {
    // Per our convention: user1 is the parent, user2 is the child.
    if (rel.relationType.code === 'parent') {
      // Parent -> Child relationship
      addEdge(rel.user1Id, rel.user2Id, 'child')
      // Child -> Parent relationship
      addEdge(rel.user2Id, rel.user1Id, 'parent')
    } else if (rel.relationType.code === 'spouse') {
      // Spouse relationships are bi-directional
      addEdge(rel.user1Id, rel.user2Id, 'spouse')
      addEdge(rel.user2Id, rel.user1Id, 'spouse')
    } else if (rel.relationType.code === 'partner') {
      // Partner relationships are bi-directional
      addEdge(rel.user1Id, rel.user2Id, 'partner')
      addEdge(rel.user2Id, rel.user1Id, 'partner')
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
): RelationshipResult | null {
  // 1. Build the adjacency list from allRelationships
  const adjacencyList = buildAdjacencyList(allRelationships)

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
        const alterParents = getParents(alterUserId)

        const commonParentsCount = alterParents.filter((p) =>
          egoParents.has(p),
        ).length

        if (commonParentsCount === 1) {
          return {
            relationship: 'Half Sibling',
            path: current.path,
            steps: current.path.length - 1,
          }
        } else {
          return {
            relationship: 'Sibling',
            path: current.path,
            steps: current.path.length - 1,
          }
        }
      } else {
        // If not a special case, translate the path normally.
        const relationship = translatePathToRelationship(current.path)
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

function translatePathToRelationship(
  path: BfsQueueItem['path'],
): string | null {
  const pathLength = path.length
  if (pathLength <= 1) return null

  const relationships = path.slice(1).map((p) => p.relationshipType)
  const pathString = relationships.join(' > ')

  const relationshipRules = [
    { label: 'Child', path: 'child', order: 1 },
    { label: 'Parent', path: 'parent', order: 1 },
    { label: 'Spouse', path: 'spouse', order: 1 },
    { label: 'Grandchild', path: 'child > child', order: 1 },
    { label: 'Grandparent', path: 'parent > parent', order: 1 },

    { label: 'Great-grandchild', path: 'child > child > child', order: 1 },
    {
      label: 'Great-grandparent',
      path: 'parent > parent > parent',
      order: 1,
    },
    { label: 'Nibling', path: 'parent > child > child', order: 1 },
    { label: 'Pibling', path: 'parent > parent > child', order: 1 },
    { label: 'Cousin', path: 'parent > parent > child > child', order: 1 },
    {
      label: 'Great-great-grandchild',
      path: 'child > child > child > child',
      order: 1,
    },
    {
      label: 'Great-great-grandparent',
      path: 'parent > parent > parent > parent',
      order: 1,
    },
    {
      label: 'Great-nibling',
      path: 'parent > child > child > child',
      order: 1,
    },
    {
      label: 'Great-pibling',
      path: 'parent > parent > parent > child',
      order: 1,
    },
    {
      label: '1st cousin-once-removed',
      path: 'parent > parent > child > child > child',
      order: 1,
    },
    {
      label: '1st cousin-once-removed',
      path: 'parent > parent > parent > child > child',
      order: 1,
    },
    {
      label: 'Great-great-nibling',
      path: 'parent > child > child > child > child',
      order: 1,
    },
    {
      label: 'Great-great-pibling',
      path: 'parent > parent > parent > parent > child',
      order: 1,
    },
    {
      label: '2nd cousin',
      path: 'parent > parent > parent > child > child > child',
      order: 1,
    },
    { label: 'Child-in-law', path: 'child > spouse', order: 2 },
    { label: 'Parent-in-law', path: 'spouse > parent', order: 2 },
    {
      label: 'Grandparent-in-law',
      path: 'spouse > parent > parent',
      order: 2,
    },
    {
      label: 'Sibling-in-law',
      path: 'spouse > parent > child',
      order: 2,
    },
    {
      label: 'Sibling-in-law',
      path: 'parent > child > spouse',
      order: 2,
    },
    {
      label: 'Great-grandparent-in-law',
      path: 'spouse > parent > parent > parent',
      order: 2,
    },
    {
      label: 'Nibling-in-law',
      path: 'spouse > parent > child > child',
      order: 2,
    },
    {
      label: 'Pibling-in-law',
      path: 'parent > parent > child > spouse',
      order: 2,
    },
    {
      label: 'Nibling-in-law',
      path: 'parent > child > child > partner',
      order: 2,
    },
    {
      label: 'Pibling-in-law',
      path: 'spouse > parent > parent > child',
      order: 2,
    },
    {
      label: 'Cousin-in-law',
      path: 'spouse > parent > parent > child > child',
      order: 2,
    },
    {
      label: 'Cousin-in-law',
      path: 'parent > parent > child > child > spouse',
      order: 2,
    },
    {
      label: 'Great-great-grandparent-in-law',
      path: 'spouse > parent > parent > parent > parent',
      order: 2,
    },
    {
      label: 'Great-nibling-in-law',
      path: 'spouse > parent > child > child > child',
      order: 2,
    },
    {
      label: 'Great-pibling-in-law',
      path: 'parent > parent > parent > child > spouse',
      order: 2,
    },
    {
      label: 'Pibling-in-law',
      path: 'spouse > parent > parent > child > spouse',
      order: 2,
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > child > child > child',
      order: 2,
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > parent > child > child',
      order: 2,
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'parent > parent > parent > child > child > spouse',
      order: 2,
    },
    {
      label: 'Great-great-nibling-in-law',
      path: 'spouse > parent > child > child > child > child',
      order: 2,
    },
    {
      label: 'Great-great-pibling-in-law',
      path: 'parent > parent > parent > parent > child > spouse',
      order: 2,
    },
    {
      label: '1st cousin-once-removed-in-law',
      path: 'spouse > parent > parent > parent > child > child > spouse',
      order: 2,
    },
    {
      label: '2nd cousin-in-law',
      path: 'spouse > parent > parent > parent > child > child > child',
      order: 2,
    },
    { label: 'Step-child', path: 'spouse > child', order: 4 },
    { label: 'Step-parent', path: 'parent > spouse', order: 4 },
    { label: 'Step-grandchild', path: 'spouse > child > child', order: 4 },
    {
      label: 'Step-grandparent',
      path: 'parent > spouse > parent',
      order: 4,
    },
    { label: 'Step-sibling', path: 'parent > spouse > child', order: 4 },
    {
      label: 'Step-great-grandchild',
      path: 'spouse > child > child > child',
      order: 4,
    },
    {
      label: 'Step-great-grandparent',
      path: 'parent > spouse > parent > parent',
      order: 4,
    },
    {
      label: 'Step-nibling',
      path: 'parent > child > spouse > child',
      order: 4,
    },
    {
      label: 'Step-pibling',
      path: 'parent > spouse > parent > child',
      order: 4,
    },
    {
      label: 'Step-great-great-grandchild',
      path: 'spouse > child > child > child > child',
      order: 4,
    },
    {
      label: 'Step-great-great-grandparent',
      path: 'parent > spouse > parent > parent > parent',
      order: 4,
    },
    {
      label: 'Step-great-nibling',
      path: 'parent > child > spouse > child > child',
      order: 4,
    },
    {
      label: 'Step-great-pibling',
      path: 'parent > spouse > parent > parent > child',
      order: 4,
    },
    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > spouse > parent > child > child > child',
      order: 4,
    },
    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > spouse > parent > parent > child > child',
      order: 4,
    },
    {
      label: 'Step-1st cousin-once-removed',
      path: 'parent > parent > parent > child > spouse > child',
      order: 4,
    },
    {
      label: 'Step-cousin',
      path: 'parent > spouse > parent > child > child',
      order: 4,
    },
    {
      label: 'Step-great-great-nibling',
      path: 'parent > child > spouse > child > child > child',
      order: 4,
    },
    {
      label: 'Step-great-great-pibling',
      path: 'parent > spouse > parent > parent > parent > child',
      order: 4,
    },
    {
      label: 'Step-2nd cousin',
      path: 'parent > spouse > parent > parent > child > child > child',
      order: 4,
    },
    {
      label: 'Step-2nd cousin',
      path: 'parent > parent > parent > child > child > spouse > child',
      order: 4,
    },
    { label: 'Partner', path: 'partner', order: 5 },
    { label: 'Co-child', path: 'partner > child', order: 5 },
    { label: 'Co-parent', path: 'parent > partner', order: 5 },
    { label: 'Co-parent', path: 'partner > parent', order: 5 },
    { label: 'Co-grandchild', path: 'partner > child > child', order: 5 },
    {
      label: 'Co-grandparent',
      path: 'parent > partner > parent',
      order: 5,
    },
    {
      label: 'Co-grandparent',
      path: 'partner > parent > parent',
      order: 5,
    },
    { label: 'Co-sibling', path: 'parent > partner > child', order: 5 },
    { label: 'Co-sibling', path: 'partner > parent > child', order: 5 },
    { label: 'Co-sibling', path: 'parent > child > partner', order: 5 },
    {
      label: 'Co-great-grandchild',
      path: 'partner > child > child > child',
      order: 5,
    },
    {
      label: 'Co-great-grandparent',
      path: 'parent > partner > parent > parent',
      order: 5,
    },
    {
      label: 'Co-great-grandparent',
      path: 'partner > parent > parent > parent',
      order: 5,
    },
    {
      label: 'Co-nibling',
      path: 'partner > parent > child > child',
      order: 5,
    },
    {
      label: 'Co-nibling',
      path: 'parent > child > partner > child',
      order: 5,
    },
    {
      label: 'Co-pibling',
      path: 'parent > partner > parent > child',
      order: 5,
    },
    {
      label: 'Co-pibling',
      path: 'partner > parent > parent > child',
      order: 5,
    },
    {
      label: 'Co-cousin',
      path: 'partner > parent > parent > child > child',
      order: 5,
    },
    {
      label: 'Co-cousin',
      path: 'parent > parent > child > child > partner',
      order: 5,
    },
    {
      label: 'Co-great-great-grandchild',
      path: 'partner > child > child > child > child',
      order: 5,
    },
    {
      label: 'Co-great-nibling',
      path: 'partner > parent > child > child > child',
      order: 5,
    },
    {
      label: 'Co-great-nibling',
      path: 'partner > parent > child > child > child',
      order: 5,
    },
    {
      label: 'Co-great-nibling',
      path: 'parent > child > child > partner > child',
      order: 5,
    },
    {
      label: 'Co-great-pibling',
      path: 'parent > partner > parent > parent > child',
      order: 5,
    },
    {
      label: 'Co-great-pibling',
      path: 'partner > parent > parent > parent > child',
      order: 5,
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'partner > parent > parent > child > child > child',
      order: 5,
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'partner > parent > parent > parent > child > child',
      order: 5,
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'parent > parent > parent > child > child > partner',
      order: 5,
    },
    {
      label: 'Co-1st cousin-once-removed',
      path: 'parent > parent > child > child > partner > child',
      order: 5,
    },
    {
      label: 'Co-2nd cousin',
      path: 'partner > parent > parent > parent > child > child > child',
      order: 5,
    },
    {
      label: 'Co-2nd cousin',
      path: 'parent > parent > parent > child > child > child > partner',
      order: 5,
    },
  ].sort((a, b) => a.order - b.order)

  for (const rule of relationshipRules) {
    if (rule.path === pathString) {
      return rule.label
    }
  }

  return 'Relative'
}
