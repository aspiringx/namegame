import { PrismaClient } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  const groupTypes = [
    { id: 1, code: 'business' },
    { id: 2, code: 'church' },
    { id: 3, code: 'family' },
    { id: 4, code: 'friends' },
    { id: 5, code: 'neighborhood' },
    { id: 6, code: 'school' },
  ];

  for (const gt of groupTypes) {
    await prisma.groupType.upsert({
      where: { id: gt.id },
      update: {},
      create: {
        id: gt.id,
        code: gt.code,
      },
    });
  }
  console.log(`Seeded ${groupTypes.length} group types.`);
  const familyGroupType = await prisma.groupType.findUnique({ where: { code: 'family' } });
  if (!familyGroupType) {
    throw new Error("Could not find 'family' group type after seeding.");
  }

  const groupUserRoles = [
    { id: 1, code: 'admin' },
    { id: 2, code: 'member' },
    { id: 3, code: 'super' },
  ];

  for (const gur of groupUserRoles) {
    await prisma.groupUserRole.upsert({
      where: { id: gur.id },
      update: {},
      create: {
        id: gur.id,
        code: gur.code,
      },
    });
  }
  console.log(`Seeded ${groupUserRoles.length} group user roles.`);
  const superUserRole = await prisma.groupUserRole.findFirst({ where: { code: 'super', groupId: null } });
  if (!superUserRole) {
    throw new Error("Could not find 'super' role after seeding.");
  }

  // Create the 'system' user if it doesn't exist
  const systemUserPassword = await bcrypt.hash('password123', 10);
  const systemUser = await prisma.user.upsert({
    where: { username: 'system' },
    update: {},
    create: {
      username: 'system',
      firstName: 'System',
      password: systemUserPassword,
    },
  });
  console.log(`Created/found 'system' user with id: ${systemUser.id}`);

  // Create the Global Admin group if it doesn't exist
  const adminGroup = await prisma.group.upsert({
    where: { slug: 'global-admin' },
    update: {
      updatedById: systemUser.id,
    },
    create: {
      name: 'Global Admin',
      slug: 'global-admin',
      description: 'Group for super administrators of the entire application.',
      idTree: 'global-admin',
      createdById: systemUser.id,
      updatedById: systemUser.id,
      groupTypeId: familyGroupType.id,
    },
  });
  console.log(`Created/found group '${adminGroup.name}' with id: ${adminGroup.id}`);

  // Create the 'joe' user if he doesn't exist
  const hashedPassword = await bcrypt.hash('password123', 10);
  const joeUser = await prisma.user.upsert({
    where: { username: 'joe' },
    update: {
      updatedById: systemUser.id,
    },
    create: {
      username: 'joe',
      firstName: 'Joe',
      password: hashedPassword,
      createdById: systemUser.id,
      updatedById: systemUser.id,
    },
  });
  console.log(`Created/found user '${joeUser.username}' with id: ${joeUser.id}`);

  // Add 'joe' to the 'Global Admin' group as a 'super' user
  await prisma.groupUser.upsert({
    where: {
      userId_groupId: {
        userId: joeUser.id,
        groupId: adminGroup.id,
      },
    },
    update: {
      roleId: superUserRole.id,
    },
    create: {
      userId: joeUser.id,
      groupId: adminGroup.id,
      roleId: superUserRole.id,
    },
  });
  console.log(`Ensured user '${joeUser.username}' is a super user in group '${adminGroup.name}'.`);

  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
