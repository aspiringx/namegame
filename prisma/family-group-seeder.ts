import { PrismaClient, User, UserUserRelationCategory } from '../src/generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  // --- Start of Cleanup ---
  console.log('Cleaning up old test family data...');
  const oldFamilyGroup = await prisma.group.findUnique({
    where: { slug: 'test-family' },
    include: { members: { select: { userId: true } } },
  });

  if (oldFamilyGroup) {
    const userIds = oldFamilyGroup.members.map((m) => m.userId);

    await prisma.userUser.deleteMany({
      where: { groupId: oldFamilyGroup.id },
    });

    await prisma.groupUser.deleteMany({
      where: { groupId: oldFamilyGroup.id },
    });

    await prisma.group.delete({
      where: { id: oldFamilyGroup.id },
    });

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });

    console.log('Cleanup complete.');
  }
  // --- End of Cleanup ---

  const csvPath = path.join(__dirname, '../family-tree-list.csv');
  const csvData = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvData.split('\n').slice(1); // Skip header

  const relationshipPaths = lines
    .map((line) => {
      const [label, path] = line.split(',');
      return { label: label?.trim(), path: path?.trim() };
    })
    .filter((p) => p.label && p.path);
  console.log('Starting seeder...');
  // Clean up existing data
  await prisma.userUser.deleteMany({});
  await prisma.userUser.deleteMany({});
  await prisma.groupUser.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.userUserRelationType.deleteMany({});
  console.log('Cleared existing data.');

  // Create relation types
  const parentRelation = await prisma.userUserRelationType.create({
    data: {
      code: 'parent',
      category: UserUserRelationCategory.family,
    },
  });

  const spouseRelation = await prisma.userUserRelationType.create({
    data: {
      code: 'spouse',
      category: UserUserRelationCategory.family,
    },
  });

  const partnerRelation = await prisma.userUserRelationType.create({
    data: {
      code: 'partner',
      category: UserUserRelationCategory.family,
    },
  });
  console.log('Created relation types.');

  // Create a family group
  const memberRole = await prisma.groupUserRole.findFirst({
    where: { code: 'member', groupId: null },
  });

  if (!memberRole) {
    throw new Error("'member' role not found. Make sure the base seeder has run.");
  }

  const familyGroup = await prisma.group.create({
    data: {
      name: 'The Test Family',
      slug: 'test-family',
      idTree: 'test-family',
      groupType: {
        connectOrCreate: {
          where: { code: 'family' },
          create: { code: 'family' },
        },
      },
    },
  });
  console.log('Created family group.');

  const users = new Map<string, User>();
  const relationships = new Set<string>();

  // Ensure Ego exists
  const ego = await getOrCreateUser('Ego', memberRole.id);

  // --- Create a dedicated half-sibling for testing ---
  const p1 = await getOrCreateUser('Ego > parent 1', memberRole.id);
  const p2 = await getOrCreateUser('Ego > parent 2', memberRole.id);
  const alter = await getOrCreateUser('Alter', memberRole.id);
  await createParentChild(p1, ego);
  await createParentChild(p2, ego);
  await createParentChild(p1, alter);
  await createParentChild(p2, alter);
  // --- End of half-sibling creation ---

  for (const { path } of relationshipPaths) {
    // Skip the conceptual half-sibling path from the CSV
    if (path.includes('1 parent')) {
      continue;
    }

    const steps = path.trim().split(/\s*>\s*/);
    let pathParts = ['Ego'];

    for (const step of steps) {
      const previousUserPath = pathParts.join(' > ');
      pathParts.push(step);
      const currentUserPath = pathParts.join(' > ');

      const previousUser = await getOrCreateUser(previousUserPath, memberRole.id);
      const currentUser = await getOrCreateUser(currentUserPath, memberRole.id);

      switch (step) {
        case 'parent':
          await createParentChild(currentUser, previousUser);
          break;
        case 'child':
          if (currentUserPath === 'Ego > parent > child') {
            const egoParent1 = await getOrCreateUser('Ego > parent', memberRole.id);
            const egoParent2 = await getOrCreateUser('Ego > parent 2', memberRole.id);
            await createParentChild(egoParent1, currentUser);
            await createParentChild(egoParent2, currentUser);
          } else {
            await createParentChild(previousUser, currentUser);
          }
          break;
        case 'spouse':
          await createSpouse(previousUser, currentUser);
          break;
        case 'partner':
          await createPartner(previousUser, currentUser);
          break;
      }

    }
  }

  async function getOrCreateUser(path: string, memberRoleId: number): Promise<User> {
    if (users.has(path)) {
      return users.get(path)!;
    }
    const email = `${path.toLowerCase().replace(/\s*>?\s*/g, '.')}@test.com`;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      // console.log(`Getting existing user: ${path}`);
      users.set(path, existingUser);
      return existingUser;
    }

    const newUser = await prisma.user.create({
      data: {
        username: email,
        password: 'password', // Add a dummy password
        firstName: path,
        email: email,
        groupMemberships: {
          create: {
            groupId: familyGroup.id,
            roleId: memberRoleId,
          },
        },
      },
    });
    users.set(path, newUser);
    return newUser;
  }

  async function createParentChild(parent: User, child: User) {
    const existing = await prisma.userUser.findFirst({
      where: {
        groupId: familyGroup.id,
        OR: [
          { user1Id: parent.id, user2Id: child.id },
          { user1Id: child.id, user2Id: parent.id },
        ],
      },
    });

    if (existing) return;

    await prisma.userUser.create({
      data: {
        user1Id: parent.id,
        user2Id: child.id,
        groupId: familyGroup.id,
        relationTypeId: parentRelation.id,
      },
    });
  }

  async function createSpouse(user1: User, user2: User) {
    const existing = await prisma.userUser.findFirst({
      where: {
        groupId: familyGroup.id,
        OR: [
          { user1Id: user1.id, user2Id: user2.id },
          { user1Id: user2.id, user2Id: user1.id },
        ],
      },
    });

    if (existing) return;

    await prisma.userUser.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id,
        groupId: familyGroup.id,
        relationTypeId: spouseRelation.id,
      },
    });
  }

  async function createPartner(user1: User, user2: User) {
    const existing = await prisma.userUser.findFirst({
      where: {
        groupId: familyGroup.id,
        OR: [
          { user1Id: user1.id, user2Id: user2.id },
          { user1Id: user2.id, user2Id: user1.id },
        ],
      },
    });

    if (existing) return;

    await prisma.userUser.create({
      data: {
        user1Id: user1.id,
        user2Id: user2.id,
        groupId: familyGroup.id,
        relationTypeId: partnerRelation.id,
      },
    });
  }

  console.log(`Seeding finished. Created ${users.size} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
