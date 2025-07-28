import type { User, UserUser, UserUserRelationType } from '../generated/prisma';

/**
 * Represents the graph of family relationships as an adjacency list.
 * The key is a user's ID.
 * The value is an array of objects, each representing a directed edge to another user
 * and the type of relationship (e.g., 'parent', 'spouse').
 */
export type AdjacencyList = Map<string, { relatedUserId: string; type: string }[]>;

/**
 * Represents an item in the queue for the Breadth-First Search (BFS) algorithm.
 */
type BfsQueueItem = {
  userId: string;
  path: { userId: string; relationshipType: string | null }[];
};

/**
 * The main result object.
 */
export type RelationshipResult = {
  relationship: string | null;
  path: BfsQueueItem['path'] | null;
};

/**
 * Finds the relationship between two users within a given group.
 *
 * @param egoUserId - The ID of the user from whose perspective the relationship is calculated.
 * @param alterUserId - The ID of the user to whom the relationship is being determined.
 * @param allRelationships - An array of all UserUser relationships for the group.
 * @returns An object containing the relationship string and the path, or null if no relationship is found.
 */
type FullRelationship = UserUser & { relationType: UserUserRelationType };

function buildAdjacencyList(relationships: FullRelationship[]): AdjacencyList {
  const list: AdjacencyList = new Map();

  const addEdge = (from: string, to: string, type: string) => {
    if (!list.has(from)) {
      list.set(from, []);
    }
    list.get(from)!.push({ relatedUserId: to, type });
  };

  for (const rel of relationships) {
    // Per our convention: user1 is the parent, user2 is the child.
    if (rel.relationType.code === 'parent') {
      // Parent -> Child relationship
      addEdge(rel.user1Id, rel.user2Id, 'child');
      // Child -> Parent relationship
      addEdge(rel.user2Id, rel.user1Id, 'parent');
    } else if (rel.relationType.code === 'spouse') {
      // Spouse relationships are bi-directional
      addEdge(rel.user1Id, rel.user2Id, 'spouse');
      addEdge(rel.user2Id, rel.user1Id, 'spouse');
    }
  }

  return list;
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
  const adjacencyList = buildAdjacencyList(allRelationships);

  // 2. Perform BFS to find the shortest path from ego to alter
  const queue: BfsQueueItem[] = [
    { userId: egoUserId, path: [{ userId: egoUserId, relationshipType: null }] },
  ];
  const visited = new Set<string>([egoUserId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    if (current.userId === alterUserId) {
      // Found the path! Now translate it.
      const relationship = translatePathToRelationship(current.path);
      return {
        relationship,
        path: current.path,
      };
    }

    const neighbors = adjacencyList.get(current.userId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.relatedUserId)) {
        visited.add(neighbor.relatedUserId);
        const newPath = [
          ...current.path,
          { userId: neighbor.relatedUserId, relationshipType: neighbor.type },
        ];
        queue.push({ userId: neighbor.relatedUserId, path: newPath });
      }
    }
  }

  // 3. Translate the path into a human-readable relationship string

  return null; // No path found
}

function translatePathToRelationship(path: BfsQueueItem['path']): string | null {
  const pathLength = path.length;

  // Path starts with Ego, so length is always number of relationships + 1.
  // A path of length 1 is just the Ego.
  if (pathLength <= 1) {
    return null;
  }

  // Direct relationships (path length 2)
  if (pathLength === 2) {
    const rel = path[1].relationshipType;
    if (rel === 'parent') return 'Parent';
    if (rel === 'child') return 'Child';
    if (rel === 'spouse') return 'Spouse';
  }

  // Grandparents, Siblings (path length 3)
  if (pathLength === 3) {
    const rel1 = path[1].relationshipType;
    const rel2 = path[2].relationshipType;

    if (rel1 === 'parent' && rel2 === 'parent') return 'Grandparent';
    if (rel1 === 'child' && rel2 === 'child') return 'Grandchild';

    // Path up to a parent, then down to another child is a sibling
    if (rel1 === 'parent' && rel2 === 'child') {
      // Ensure it's not the ego user themselves
      if (path[0].userId !== path[2].userId) {
        return 'Sibling';
      }
    }
  }

  // Path length 4: Uncle/Aunt
  if (pathLength === 4) {
    const rel1 = path[1].relationshipType;
    const rel2 = path[2].relationshipType;
    const rel3 = path[3].relationshipType;

    // Path up to a grandparent, then down to their child (a pibling)
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'child') {
      return 'Pibling';
    }

    // Path up to a parent, over to a sibling, then down to their child (a nibling)
    if (rel1 === 'parent' && rel2 === 'child' && rel3 === 'child') {
      return 'Nibling';
    }
  }

  // Path length 5: Cousin
  if (pathLength === 5) {
    const rel1 = path[1].relationshipType;
    const rel2 = path[2].relationshipType;
    const rel3 = path[3].relationshipType;
    const rel4 = path[4].relationshipType;

    // Path up to a grandparent, down to an aunt/uncle, then down to their child (a cousin)
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'child' && rel4 === 'child') {
      return 'Cousin';
    }
  }

  return 'Relative'; // Generic fallback for now
}
