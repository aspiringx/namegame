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
  const relationships = path.slice(1).map((p) => p.relationshipType);

  // Path starts with Ego, so length is always number of relationships + 1.
  // A path of length 1 is just the Ego.
  if (pathLength <= 1) {
    return null;
  }

  // Direct relationships (path length 2)
  if (pathLength === 2) {
    const [rel] = relationships;
    if (rel === 'parent') return 'Parent';
    if (rel === 'child') return 'Child';
    if (rel === 'spouse') return 'Spouse';
  }

  // Grandparents, Siblings, and in-laws (path length 3)
  if (pathLength === 3) {
    const [rel1, rel2] = relationships;

    if (rel1 === 'parent' && rel2 === 'parent') return 'Grandparent';
    if (rel1 === 'child' && rel2 === 'child') return 'Grandchild';

    // Path up to a parent, then down to another child is a sibling
    if (rel1 === 'parent' && rel2 === 'child') {
      // Ensure it's not the ego user themselves
      if (path[0].userId !== path[2].userId) {
        return 'Sibling';
      }
    }

    // Path from child up to their parent, then to that parent's spouse.
    if (rel1 === 'parent' && rel2 === 'spouse') {
      return 'Step Parent';
    }

    // Path from ego to spouse, then to spouse's parent.
    if (rel1 === 'spouse' && rel2 === 'parent') {
      return 'Parent-in-law';
    }

    // Path from ego to spouse, then to spouse's child.
    // This is a Step-Child ONLY if a direct child relationship doesn't exist.
    // Since BFS finds the shortest path, a 2-step 'child' path would be found
    // before this 3-step path, so we can be sure this is a step-child.
    if (rel1 === 'spouse' && rel2 === 'child') {
      return 'Step Child';
    }
  }

  // Path length 4: Pibling, Nibling, Sibling-in-law
  if (pathLength === 4) {
    const [rel1, rel2, rel3] = relationships;

    // Path up to a grandparent, then down to their child (a pibling)
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'child') {
      return 'Pibling (aunt/uncle)';
    }

    // Path up to a parent, over to a sibling, then down to their child (a nibling)
    if (rel1 === 'parent' && rel2 === 'child' && rel3 === 'child') {
      return 'Nibling (niece/nephew)';
    }

    // Path to spouse's sibling: Ego -> Spouse -> Parent-in-law -> Sibling-in-law
    if (rel1 === 'spouse' && rel2 === 'parent' && rel3 === 'child') {
      return 'Sibling-in-law';
    }

    // Path to sibling's spouse: Ego -> Parent -> Sibling -> Spouse
    if (rel1 === 'parent' && rel2 === 'child' && rel3 === 'spouse') {
      return 'Sibling-in-law';
    }

    // Path to spouse's grandparent: Ego -> Spouse -> Parent-in-law -> Grandparent-in-law
    if (rel1 === 'spouse' && rel2 === 'parent' && rel3 === 'parent') {
      return 'Grandparent-in-law';
    }

    // Path to great-grandparent: Ego -> Parent -> Grandparent -> Great-grandparent
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'parent') {
      return 'Great-grandparent';
    }
  }

  // Path length 5: Cousin, Pibling-in-law, Nibling-in-law
  if (pathLength === 5) {
    const [rel1, rel2, rel3, rel4] = relationships;

    // Path up to a grandparent, down to an aunt/uncle, then down to their child (a cousin)
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'child' && rel4 === 'child') {
      return 'Cousin';
    }

    // Path to Pibling's spouse: Ego -> Parent -> Grandparent -> Pibling -> Spouse
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'child' && rel4 === 'spouse') {
      return 'Pibling'; // Per request, spouse of Pibling is a Pibling
    }

    // Path to Spouse's Nibling: Ego -> Spouse -> Parent-in-law -> Sibling-in-law -> Nibling
    if (rel1 === 'spouse' && rel2 === 'parent' && rel3 === 'child' && rel4 === 'child') {
      return 'Nibling'; // Per request, spouse's Nibling is a Nibling
    }

    // Path to Spouse's Pibling: Ego -> Spouse -> Parent-in-law -> Grandparent-in-law -> Pibling-in-law
    if (rel1 === 'spouse' && rel2 === 'parent' && rel3 === 'parent' && rel4 === 'child') {
      return 'Pibling-in-law';
    }

    // Path to great-pibling: Ego -> Parent -> Grandparent -> Great-Grandparent -> Great-Pibling
    if (rel1 === 'parent' && rel2 === 'parent' && rel3 === 'parent' && rel4 === 'child') {
      return 'Great-pibling (aunt/uncle)';
    }
  }

  // Path length 6: Cousin-in-law and First cousin once removed
  if (pathLength === 6) {
    const [rel1, rel2, rel3, rel4, rel5] = relationships;

    // Path to cousin's spouse: Ego -> Parent -> Grandparent -> Pibling -> Cousin -> Spouse
    if (
      rel1 === 'parent' &&
      rel2 === 'parent' &&
      rel3 === 'child' &&
      rel4 === 'child' &&
      rel5 === 'spouse'
    ) {
      return 'Cousin-in-law';
    }

    // Path to cousin's child: Ego -> Parent -> Grandparent -> Pibling -> Cousin -> Child
    if (
      rel1 === 'parent' &&
      rel2 === 'parent' &&
      rel3 === 'child' &&
      rel4 === 'child' &&
      rel5 === 'child'
    ) {
      return 'First cousin once removed';
    }

    // Path to parent's cousin: Ego -> Parent -> Grandparent -> Great-Grandparent -> Great-Aunt/Uncle -> Parent's Cousin
    if (
      rel1 === 'parent' &&
      rel2 === 'parent' &&
      rel3 === 'parent' &&
      rel4 === 'child' &&
      rel5 === 'child'
    ) {
      return 'First cousin once removed';
    }

    // Path to spouse's cousin: Ego -> Spouse -> Parent-in-law -> Grandparent-in-law -> Pibling-in-law -> Cousin-in-law
    if (
      rel1 === 'spouse' &&
      rel2 === 'parent' &&
      rel3 === 'parent' &&
      rel4 === 'child' &&
      rel5 === 'child'
    ) {
      return 'Cousin-in-law';
    }
  }

  // Path length 7: First cousin once removed in-law and spouse's cousin-in-law
  if (pathLength === 7) {
    const [rel1, rel2, rel3, rel4, rel5, rel6] = relationships;

    // Path to spouse's first cousin once removed: Ego -> Spouse -> ... -> First cousin once removed in-law
    if (
      rel1 === 'spouse' &&
      rel2 === 'parent' &&
      rel3 === 'parent' &&
      rel4 === 'child' &&
      rel5 === 'child' &&
      rel6 === 'child'
    ) {
      return 'First cousin once removed in-law';
    }

    // Path from spouse to ego's cousin's spouse: Spouse -> Ego -> Parent -> Grandparent -> Pibling -> Cousin -> Spouse
    if (
      rel1 === 'spouse' &&
      rel2 === 'parent' &&
      rel3 === 'parent' &&
      rel4 === 'child' &&
      rel5 === 'child' &&
      rel6 === 'spouse'
    ) {
      return 'Cousin-in-law';
    }

    // Path to second cousin: Ego's Child -> Ego -> Parent -> Grandparent -> Pibling -> Cousin -> Cousin's Child (Second Cousin)
    if (
      rel1 === 'parent' &&
      rel2 === 'parent' &&
      rel3 === 'parent' &&
      rel4 === 'child' &&
      rel5 === 'child' &&
      rel6 === 'child'
    ) {
      return 'Second cousin';
    }
  }

  return 'Relative'; // Generic fallback for now
}
