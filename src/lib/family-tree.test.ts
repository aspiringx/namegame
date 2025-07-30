import { describe, it, expect } from 'vitest';
import { getRelationship } from './family-tree';
import type { UserUser, UserUserRelationType } from '../generated/prisma';

type FullRelationship = UserUser & { relationType: UserUserRelationType };

// --- Mock Data Setup ---
const greatGrandpa = { id: '1', name: 'Great Grandpa' };
const greatGrandma = { id: '2', name: 'Great Grandma' };
const grandpa = { id: '3', name: 'Grandpa' };
const grandma = { id: '4', name: 'Grandma' };
const dad = { id: '5', name: 'Dad' };
const mom = { id: '6', name: 'Mom' };
const ego = { id: '7', name: 'Ego' }; // Our perspective
const sibling = { id: '8', name: 'Sibling' };
const uncle = { id: '9', name: 'Uncle' };
const aunt = { id: '10', name: 'Aunt' };
const cousin = { id: '11', name: 'Cousin' };
const nibling = { id: '12', name: 'Nibling' };

const mockRelationships: FullRelationship[] = [
  // Gen 1
  { user1Id: greatGrandpa.id, user2Id: grandpa.id, relationType: { code: 'parent' } },
  { user1Id: greatGrandma.id, user2Id: grandpa.id, relationType: { code: 'parent' } },
  // Gen 2
  { user1Id: grandpa.id, user2Id: dad.id, relationType: { code: 'parent' } },
  { user1Id: grandma.id, user2Id: dad.id, relationType: { code: 'parent' } },
  { user1Id: grandpa.id, user2Id: uncle.id, relationType: { code: 'parent' } }, // Uncle is Dad's brother
  { user1Id: grandma.id, user2Id: uncle.id, relationType: { code: 'parent' } },
  { user1Id: uncle.id, user2Id: cousin.id, relationType: { code: 'parent' } }, // Cousin is Uncle's child

  // Gen 3
  { user1Id: dad.id, user2Id: ego.id, relationType: { code: 'parent' } },
  { user1Id: mom.id, user2Id: ego.id, relationType: { code: 'parent' } },
  { user1Id: dad.id, user2Id: sibling.id, relationType: { code: 'parent' } },
  { user1Id: mom.id, user2Id: sibling.id, relationType: { code: 'parent' } },
  { user1Id: sibling.id, user2Id: nibling.id, relationType: { code: 'parent' } },

  // Spouses
  { user1Id: greatGrandpa.id, user2Id: greatGrandma.id, relationType: { code: 'spouse' } },
  { user1Id: grandpa.id, user2Id: grandma.id, relationType: { code: 'spouse' } },
  { user1Id: dad.id, user2Id: mom.id, relationType: { code: 'spouse' } },
].map(r => ({ ...r, groupId: 1, greetCount: 0, relationTypeId: 0, createdAt: new Date(), updatedAt: new Date(), deletedAt: null, relationType: { ...r.relationType, id: 0, category: 'family', groupId: null } }));


describe('getRelationship', () => {
  it('should return null if no relationship is found', () => {
    const result = getRelationship(ego.id, '100', mockRelationships);
    expect(result).toBeNull();
  });

  it('should identify a parent', () => {
    const result = getRelationship(ego.id, dad.id, mockRelationships);
    expect(result?.relationship).toBe('Parent');
  });

  it('should identify a child', () => {
    const result = getRelationship(dad.id, ego.id, mockRelationships);
    expect(result?.relationship).toBe('Child');
  });

  it('should identify a spouse', () => {
    const result = getRelationship(dad.id, mom.id, mockRelationships);
    expect(result?.relationship).toBe('Spouse');
  });

  it('should identify a sibling', () => {
    const result = getRelationship(ego.id, sibling.id, mockRelationships);
    expect(result?.relationship).toBe('Sibling');
  });

  it('should identify a grandparent', () => {
    const result = getRelationship(ego.id, grandpa.id, mockRelationships);
    expect(result?.relationship).toBe('Grandparent');
  });

  it('should identify a grandchild', () => {
    const result = getRelationship(grandpa.id, ego.id, mockRelationships);
    expect(result?.relationship).toBe('Grandchild');
  });

  it('should identify a pibling (aunt/uncle)', () => {
    const result = getRelationship(ego.id, uncle.id, mockRelationships);
    expect(result?.relationship).toBe('Pibling');
  });

  it('should identify a cousin', () => {
    const result = getRelationship(ego.id, cousin.id, mockRelationships);
    expect(result?.relationship).toBe('Cousin');
  });

  it('should identify a nibling (niece/nephew)', () => {
    const result = getRelationship(ego.id, nibling.id, mockRelationships);
    expect(result?.relationship).toBe('Nibling');
  });
});
