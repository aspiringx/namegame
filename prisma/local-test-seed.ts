import { PrismaClient, GroupUserRole } from '../src/generated/prisma';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding for local testing...`);

  // Ensure the test group exists before we do anything else
  const testGroup = await prisma.group.upsert({
    where: { slug: 'local-test-group' },
    update: {},
    create: {
      name: 'Local Test Group',
      slug: 'local-test-group',
      description: 'Group for local testing',
      idTree: 'local-test-group',
    },
  });
  console.log(`Ensured group '${testGroup.name}' exists with id: ${testGroup.id}`);

  const targetUserIdForRelations = 'cmd0pfigi0002ih9j5havwkvz';
  const targetGroupId = testGroup.id;
  const numberOfUsersToCreate = 50;
  const numberOfRelationsToCreate = 15;

  // 1. Add 50 random users
  const createdUsers = [];
  console.log(`Creating ${numberOfUsersToCreate} random users...`);
  for (let i = 0; i < numberOfUsersToCreate; i++) {
    try {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          username: faker.internet.userName().toLowerCase() + Math.random().toString(36).substring(2, 5),
          firstName: faker.person.firstName(),
          lastName: faker.person.lastName(),
          email: faker.internet.email().toLowerCase(),
          password: hashedPassword,
        },
      });
      createdUsers.push(user);
      console.log(` -> Created user ${user.username} with id: ${user.id}`);
    } catch (error: any) {
        console.error(`Failed to create user ${i + 1}. It might be a duplicate username or email. Skipping.`, error.message);
    }
  }
  console.log(`Successfully created ${createdUsers.length} users.`);

  // 2. Add them all to the test group with a role of 'member'
  console.log(`\nEnsuring 'member' role exists for group ${targetGroupId}...`);
  const memberRole = await prisma.groupUserRole.upsert({
    where: { code_groupId: { code: 'member', groupId: targetGroupId } },
    update: {},
    create: { code: 'member', groupId: targetGroupId },
  });
  console.log(`Ensured 'member' role exists with id: ${memberRole.id}`);

  console.log(`\nAdding ${createdUsers.length} users to group ${targetGroupId} as members...`);
  for (const user of createdUsers) {
    await prisma.groupUser.create({
      data: {
        userId: user.id,
        groupId: targetGroupId,
        roleId: memberRole.id,
      },
    });
  }
  console.log(`Successfully added ${createdUsers.length} users to group ${targetGroupId}.`);

  // 3. Add a UserUser relationship between 15 of them and a specific user
  console.log(`\nCreating ${numberOfRelationsToCreate} relationships with user ${targetUserIdForRelations}...`);
  const usersForRelation = createdUsers.slice(0, numberOfRelationsToCreate);
  for (const user of usersForRelation) {
    await prisma.userUser.create({
      data: {
        user1Id: targetUserIdForRelations,
        user2Id: user.id,
        groupId: targetGroupId,
      },
    });
  }
  console.log(`Successfully created ${usersForRelation.length} relationships.`);

  console.log(`\nSeeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
