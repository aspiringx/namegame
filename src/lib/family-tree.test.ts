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
const egoSpouse = { id: '13', name: 'Ego Spouse' };
const parentInLaw = { id: '14', name: 'Parent In Law' };
const stepChild = { id: '15', name: 'Step Child' };
const piblingSpouse = { id: '16', name: 'Pibling Spouse' };
const spouseSibling = { id: '17', name: 'Spouse Sibling' };
const spouseNibling = { id: '18', name: 'Spouse Nibling' };
const siblingSpouse = { id: '19', name: 'Sibling Spouse' };
const cousinSpouse = { id: '20', name: 'Cousin Spouse' };
const cousinChild = { id: '21', name: 'Cousin Child' };
const greatGrandparent = { id: '22', name: 'Great Grandparent' };
const greatUncle = { id: '23', name: 'Great Uncle' };
const parentCousin = { id: '24', name: 'Parent Cousin' };

// --- Spouse's Family Mock Data ---
const spouseGrandparent = { id: '25', name: 'Spouse Grandparent' };
const spousePibling = { id: '26', name: 'Spouse Pibling' }; // Sibling of parent-in-law
const spouseCousin = { id: '27', name: 'Spouse Cousin' }; // Child of spouse's pibling
const spouseFirstCousinOnceRemoved = { id: '28', name: 'Spouse First Cousin Once Removed' }; // Child of spouse's cousin
const egoChild = { id: '29', name: 'Ego Child' };

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

  // In-Laws & Step-family
  { user1Id: parentInLaw.id, user2Id: egoSpouse.id, relationType: { code: 'parent' } },
  { user1Id: egoSpouse.id, user2Id: stepChild.id, relationType: { code: 'parent' } },
  { user1Id: parentInLaw.id, user2Id: spouseSibling.id, relationType: { code: 'parent' } },
  { user1Id: spouseSibling.id, user2Id: spouseNibling.id, relationType: { code: 'parent' } },

  // Spouses
  { user1Id: greatGrandpa.id, user2Id: greatGrandma.id, relationType: { code: 'spouse' } },
  { user1Id: grandpa.id, user2Id: grandma.id, relationType: { code: 'spouse' } },
  { user1Id: dad.id, user2Id: mom.id, relationType: { code: 'spouse' } },
  { user1Id: ego.id, user2Id: egoSpouse.id, relationType: { code: 'spouse' } },
  { user1Id: uncle.id, user2Id: piblingSpouse.id, relationType: { code: 'spouse' } },
  { user1Id: sibling.id, user2Id: siblingSpouse.id, relationType: { code: 'spouse' } },
  { user1Id: cousin.id, user2Id: cousinSpouse.id, relationType: { code: 'spouse' } },
  { user1Id: cousin.id, user2Id: cousinChild.id, relationType: { code: 'parent' } },
  { user1Id: greatGrandparent.id, user2Id: grandpa.id, relationType: { code: 'parent' } },
  { user1Id: greatGrandparent.id, user2Id: greatUncle.id, relationType: { code: 'parent' } },
  { user1Id: greatUncle.id, user2Id: parentCousin.id, relationType: { code: 'parent' } },

  // Relationships for Spouse's Family
  { user1Id: spouseGrandparent.id, user2Id: parentInLaw.id, relationType: { code: 'parent' } },
  { user1Id: spouseGrandparent.id, user2Id: spousePibling.id, relationType: { code: 'parent' } },
  { user1Id: spousePibling.id, user2Id: spouseCousin.id, relationType: { code: 'parent' } },
  { user1Id: spouseCousin.id, user2Id: spouseFirstCousinOnceRemoved.id, relationType: { code: 'parent' } },
  { user1Id: ego.id, user2Id: egoChild.id, relationType: { code: 'parent' } },
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
    expect(result?.relationship).toBe('Pibling (aunt/uncle)');
  });

  it('should identify a cousin', () => {
    const result = getRelationship(ego.id, cousin.id, mockRelationships);
    expect(result?.relationship).toBe('Cousin');
  });

  it('should identify a nibling (niece/nephew)', () => {
    const result = getRelationship(ego.id, nibling.id, mockRelationships);
    expect(result?.relationship).toBe('Nibling (niece/nephew)');
  });

  // --- In-Law and Step-Family Tests ---

  it('should identify a parent-in-law', () => {
    const result = getRelationship(ego.id, parentInLaw.id, mockRelationships);
    expect(result?.relationship).toBe('Parent-in-law');
  });

  it('should identify a step-child', () => {
    const result = getRelationship(ego.id, stepChild.id, mockRelationships);
    expect(result?.relationship).toBe('Step Child');
  });

  it('should identify a step-parent', () => {
    const result = getRelationship(stepChild.id, ego.id, mockRelationships);
    expect(result?.relationship).toBe('Step Parent');
  });

  it("should identify a pibling's spouse as a pibling", () => {
    const result = getRelationship(ego.id, piblingSpouse.id, mockRelationships);
    expect(result?.relationship).toBe('Pibling');
  });

  it("should identify a spouse's nibling as a nibling", () => {
    const result = getRelationship(ego.id, spouseNibling.id, mockRelationships);
    expect(result?.relationship).toBe('Nibling');
  });

  it("should identify a spouse's sibling as a sibling-in-law", () => {
    const result = getRelationship(ego.id, spouseSibling.id, mockRelationships);
    expect(result?.relationship).toBe('Sibling-in-law');
  });

  it("should identify a sibling's spouse as a sibling-in-law", () => {
    const result = getRelationship(ego.id, siblingSpouse.id, mockRelationships);
    expect(result?.relationship).toBe('Sibling-in-law');
  });

  it("should identify a cousin's spouse as a cousin-in-law", () => {
    const result = getRelationship(ego.id, cousinSpouse.id, mockRelationships);
    expect(result?.relationship).toBe('Cousin-in-law');
  });

  it("should identify a cousin's child as a first cousin once removed", () => {
    const result = getRelationship(ego.id, cousinChild.id, mockRelationships);
    expect(result?.relationship).toBe('First cousin once removed');
  });

  it("should identify a parent's cousin as a first cousin once removed", () => {
    const result = getRelationship(ego.id, parentCousin.id, mockRelationships);
    expect(result?.relationship).toBe('First cousin once removed');
  });

  it("should identify a spouse's grandparent as a grandparent-in-law", () => {
    const result = getRelationship(ego.id, spouseGrandparent.id, mockRelationships);
    expect(result?.relationship).toBe('Grandparent-in-law');
  });

  it("should identify a spouse's pibling as a pibling-in-law", () => {
    const result = getRelationship(ego.id, spousePibling.id, mockRelationships);
    expect(result?.relationship).toBe('Pibling-in-law');
  });

  it("should identify a spouse's cousin as a cousin-in-law", () => {
    const result = getRelationship(ego.id, spouseCousin.id, mockRelationships);
    expect(result?.relationship).toBe('Cousin-in-law');
  });

  it("should identify a spouse's first cousin once removed as a first cousin once removed in-law", () => {
    const result = getRelationship(ego.id, spouseFirstCousinOnceRemoved.id, mockRelationships);
    expect(result?.relationship).toBe('First cousin once removed in-law');
  });

  it("should identify ego's cousin's spouse as a cousin-in-law for the spouse", () => {
    const result = getRelationship(egoSpouse.id, cousinSpouse.id, mockRelationships);
    expect(result?.relationship).toBe('Cousin-in-law');
  });

  it('should identify a great-grandparent', () => {
    const result = getRelationship(ego.id, greatGrandpa.id, mockRelationships);
    expect(result?.relationship).toBe('Great-grandparent');
  });

  it('should identify a great-pibling (great-aunt/uncle)', () => {
    const result = getRelationship(ego.id, greatUncle.id, mockRelationships);
    expect(result?.relationship).toBe('Great-pibling (aunt/uncle)');
  });

  it('should identify a second cousin', () => {
    const result = getRelationship(egoChild.id, cousinChild.id, mockRelationships);
    expect(result?.relationship).toBe('Second cousin');
  });
});
