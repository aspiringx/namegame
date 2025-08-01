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
      // Found the path! Now check for special cases like half-siblings.
      const pathString = current.path
        .slice(1)
        .map((p) => p.relationshipType)
        .join(' -> ');

      if (pathString === 'parent -> child') {
        const getParents = (userId: string): string[] => {
          const neighbors = adjacencyList.get(userId) || [];
          return neighbors
            .filter((n) => n.type === 'parent')
            .map((n) => n.relatedUserId);
        };

        const egoParents = new Set(getParents(egoUserId));
        const alterParents = getParents(alterUserId);

        const commonParentsCount = alterParents.filter((p) =>
          egoParents.has(p),
        ).length;

        if (commonParentsCount === 1) {
          return { relationship: 'Half Sibling', path: current.path };
        } else {
          return { relationship: 'Sibling', path: current.path };
        }
      }

      // If not a special case, translate the path normally.
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
  if (pathLength <= 1) return null;

  const relationships = path.slice(1).map((p) => p.relationshipType);
  const pathString = relationships.join(' -> ');
  console.log('pathString', pathString);
  if (pathString === 'parent -> parent -> parent -> child') {
    return 'Great Pibling (aunt/uncle)';
  }
  // Ego's direct relatives
  if (pathString === 'parent') return 'Parent';
  if (pathString === 'child') return 'Child';
  if (pathString === 'spouse') return 'Spouse';
  if (pathString === 'parent -> parent') return 'Grandparent';
  if (pathString === 'parent -> parent -> child') return 'Pibling (aunt/uncle)';
  if (pathString === 'parent -> parent -> parent') return 'Great-grandparent';
  if (pathString === 'parent -> parent -> parent -> child') return 'Great Pibling (aunt/uncle)';
  if (pathString === 'parent -> parent -> child -> child') return 'Cousin';
  if (pathString === 'parent -> parent -> parent -> child -> child') return 'First cousin once removed';
  if (pathString === 'parent -> parent -> child -> child -> child') return 'First cousin once removed';
  if (pathString === 'parent -> child -> child') return 'Nibling (niece/nephew)';

  // Step-relatives
  if (pathString === 'parent -> spouse') return 'Step Parent';
  if (pathString === 'spouse -> child') return 'Step Child';
  if (pathString === 'parent -> spouse -> child') return 'Step Sibling';

  // In-laws (relatives of spouse)
  if (pathString === 'spouse -> parent') return 'Parent-in-law';
  if (pathString === 'spouse -> parent -> child') return 'Sibling-in-law';
  if (pathString === 'spouse -> parent -> parent') return 'Grandparent-in-law';
  if (pathString === 'spouse -> parent -> parent -> child') return 'Pibling-in-law';
  if (pathString === 'spouse -> parent -> child -> child') return 'Nibling-in-law';
  if (pathString === 'spouse -> parent -> parent -> child -> child') return 'Cousin-in-law';

  // Spouses of relatives
  if (pathString === 'parent -> child -> spouse') return 'Sibling-in-law';
  if (pathString === 'parent -> parent -> child -> spouse') return 'Pibling-in-law';
  if (pathString === 'parent -> parent -> child -> child -> spouse') return 'Cousin-in-law';

  return 'Relative';
}
