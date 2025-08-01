import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting family group seeder...');

  // 1. Create a new family group
  const familyGroup = await prisma.group.upsert({
    where: { slug: 'the-fam' },
    update: {},
    create: {
      name: 'The Fam',
      slug: 'the-fam',
      idTree: 'the-fam',
      groupType: {
        connectOrCreate: {
          where: { code: 'family' },
          create: { code: 'family' },
        },
      },
    },
  });
  console.log(`Created group: "${familyGroup.name}"`);

  // 2. Define all the users from the test file
  const usersToCreate = [
    { id: '1', name: 'Great Grandpa' },
    { id: '2', name: 'Great Grandma' },
    { id: '3', name: 'Grandpa' },
    { id: '4', name: 'Grandma' },
    { id: '5', name: 'Dad' },
    { id: '6', name: 'Mom' },
    { id: '7', name: 'Ego' },
    { id: '8', name: 'Sibling' },
    { id: '9', name: 'Uncle' },
    { id: '10', name: 'Aunt' },
    { id: '11', name: 'Cousin' },
    { id: '12', name: 'Nibling' },
    { id: '13', name: 'Ego Spouse' },
    { id: '14', name: 'Parent In Law' },
    { id: '15', name: 'Step Child' },
    { id: '16', name: 'Pibling Spouse' },
    { id: '17', name: 'Spouse Sibling' },
    { id: '18', name: 'Spouse Nibling' },
    { id: '19', name: 'Sibling Spouse' },
    { id: '20', name: 'Cousin Spouse' },
    { id: '21', name: 'Cousin Child' },
    { id: '23', name: 'Great Uncle' },
    { id: '24', name: 'Parent Cousin' },
    { id: '25', name: 'Spouse Grandparent' },
    { id: '26', name: 'Spouse Pibling' },
    { id: '27', name: 'Spouse Cousin' },
    { id: '28', name: 'Spouse First Cousin Once Removed' },
    { id: '29', name: 'Ego Child' },
  ];

  // 3. Delete existing users and relationships to ensure a clean slate
  const userIdsToDelete = usersToCreate.map(u => u.id);

  await prisma.userUser.deleteMany({
    where: {
      groupId: familyGroup.id,
      OR: [
        { user1Id: { in: userIdsToDelete } },
        { user2Id: { in: userIdsToDelete } },
      ],
    },
  });

  await prisma.groupUser.deleteMany({
    where: {
      groupId: familyGroup.id,
      userId: { in: userIdsToDelete },
    },
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: userIdsToDelete },
    },
  });
  console.log(`Deleted existing test users and their relationships.`);

  // 4. Create the users
  const createdUsers = [];
  const hashedPassword = await bcrypt.hash('password123', 10);

  for (const userData of usersToCreate) {
    const user = await prisma.user.upsert({
      where: { id: userData.id },
      update: {
        password: hashedPassword,
      },
      create: {
        id: userData.id,
        firstName: userData.name,
        username: userData.name.replace(/\s+/g, '').toLowerCase(),
        email: `${userData.name.replace(/\s+/g, '.').toLowerCase()}@test.com`,
        password: hashedPassword,
      },
    });
    createdUsers.push(user);
  }
  console.log(`Created ${createdUsers.length} users.`);

  // 3. Add all users to the group as members
  const memberRole = await prisma.groupUserRole.findFirst({ where: { code: 'member', groupId: null } });
  if (!memberRole) {
    throw new Error('Could not find global "member" role. Please run the main seeder first.');
  }

  for (const user of createdUsers) {
    await prisma.groupUser.upsert({
      where: { userId_groupId: { userId: user.id, groupId: familyGroup.id } },
      update: { roleId: memberRole.id },
      create: {
        userId: user.id,
        groupId: familyGroup.id,
        roleId: memberRole.id,
      },
    });
  }
  console.log(`Added all users to "${familyGroup.name}".`);

  // 4. Establish relationships
  const parentRelationType = await prisma.userUserRelationType.findFirst({ where: { code: 'parent' } });
  const spouseRelationType = await prisma.userUserRelationType.findFirst({ where: { code: 'spouse' } });

  if (!parentRelationType || !spouseRelationType) {
    throw new Error('Could not find parent or spouse relation types. Please seed them first.');
  }

  const relationships = [
    // =================================================================
    // Generation +2: Great Grandparents
    // =================================================================
    { user1Id: '1', user2Id: '2', typeId: spouseRelationType.id },   // Great Grandpa - Great Grandma

    // =================================================================
    // Generation +1: Grandparents, Great Piblings
    // =================================================================
    { user1Id: '1', user2Id: '3', typeId: parentRelationType.id },   // Great Grandpa -> Grandpa
    { user1Id: '2', user2Id: '3', typeId: parentRelationType.id },   // Great Grandma -> Grandpa
    { user1Id: '1', user2Id: '4', typeId: parentRelationType.id },   // Great Grandpa -> Grandma
    { user1Id: '2', user2Id: '4', typeId: parentRelationType.id },   // Great Grandma -> Grandma
    { user1Id: '1', user2Id: '23', typeId: parentRelationType.id },  // Great Grandpa -> Great Uncle
    { user1Id: '2', user2Id: '23', typeId: parentRelationType.id },  // Great Grandma -> Great Uncle
    { user1Id: '3', user2Id: '4', typeId: spouseRelationType.id },   // Grandpa - Grandma
    // Spouse's side
    { user1Id: '25', user2Id: '14', typeId: parentRelationType.id }, // Spouse Grandparent -> Parent In Law
    { user1Id: '25', user2Id: '26', typeId: parentRelationType.id }, // Spouse Grandparent -> Spouse Pibling

    // =================================================================
    // Generation 0: Parents, Piblings, Parent Cousins
    // =================================================================
    // Ego's side
    { user1Id: '3', user2Id: '5', typeId: parentRelationType.id },   // Grandpa -> Dad
    { user1Id: '4', user2Id: '5', typeId: parentRelationType.id },   // Grandma -> Dad
    { user1Id: '3', user2Id: '9', typeId: parentRelationType.id },   // Grandpa -> Uncle
    { user1Id: '4', user2Id: '9', typeId: parentRelationType.id },   // Grandma -> Uncle
    { user1Id: '3', user2Id: '10', typeId: parentRelationType.id },  // Grandpa -> Aunt
    { user1Id: '4', user2Id: '10', typeId: parentRelationType.id },  // Grandma -> Aunt
    { user1Id: '23', user2Id: '24', typeId: parentRelationType.id },// Great Uncle -> Parent Cousin
    { user1Id: '5', user2Id: '6', typeId: spouseRelationType.id },   // Dad - Mom
    { user1Id: '9', user2Id: '16', typeId: spouseRelationType.id },  // Uncle - Pibling Spouse
    // Spouse's side
    { user1Id: '14', user2Id: '13', typeId: parentRelationType.id },// Parent In Law -> Ego Spouse
    { user1Id: '14', user2Id: '17', typeId: parentRelationType.id },// Parent In Law -> Spouse Sibling
    { user1Id: '26', user2Id: '27', typeId: parentRelationType.id },// Spouse Pibling -> Spouse Cousin

    // =================================================================
    // Generation -1: Ego, Siblings, Cousins
    // =================================================================
    // Ego's side
    { user1Id: '5', user2Id: '7', typeId: parentRelationType.id },   // Dad -> Ego
    { user1Id: '6', user2Id: '7', typeId: parentRelationType.id },   // Mom -> Ego
    { user1Id: '5', user2Id: '8', typeId: parentRelationType.id },   // Dad -> Sibling
    { user1Id: '6', user2Id: '8', typeId: parentRelationType.id },   // Mom -> Sibling
    { user1Id: '9', user2Id: '11', typeId: parentRelationType.id },  // Uncle -> Cousin
    { user1Id: '10', user2Id: '11', typeId: parentRelationType.id }, // Aunt -> Cousin
    { user1Id: '7', user2Id: '13', typeId: spouseRelationType.id },  // Ego - Ego Spouse
    { user1Id: '8', user2Id: '19', typeId: spouseRelationType.id },  // Sibling - Sibling Spouse
    { user1Id: '11', user2Id: '20', typeId: spouseRelationType.id }, // Cousin - Cousin Spouse
    // Spouse's side
    { user1Id: '17', user2Id: '18', typeId: parentRelationType.id },// Spouse Sibling -> Spouse Nibling
    { user1Id: '27', user2Id: '28', typeId: parentRelationType.id },// Spouse Cousin -> Spouse First Cousin Once Removed

    // =================================================================
    // Generation -2: Children, Niblings, Cousin's Children
    // =================================================================
    { user1Id: '7', user2Id: '29', typeId: parentRelationType.id },  // Ego -> Ego Child
    { user1Id: '13', user2Id: '15', typeId: parentRelationType.id },// Ego Spouse -> Step Child
    { user1Id: '8', user2Id: '12', typeId: parentRelationType.id }, // Sibling -> Nibling
    { user1Id: '11', user2Id: '21', typeId: parentRelationType.id }, // Cousin -> Cousin Child
  ];

  for (const rel of relationships) {
    await prisma.userUser.upsert({
      where: {
        user1Id_user2Id_groupId: {
          user1Id: rel.user1Id,
          user2Id: rel.user2Id,
          groupId: familyGroup.id,
        },
      },
      update: { relationTypeId: rel.typeId },
      create: {
        user1Id: rel.user1Id,
        user2Id: rel.user2Id,
        groupId: familyGroup.id,
        relationTypeId: rel.typeId,
      },
    });
  }
  console.log(`Created ${relationships.length} relationships.`);

  console.log('Family group seeding finished successfully.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
