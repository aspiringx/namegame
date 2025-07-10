import { PrismaClient, GroupUserRole } from '../src/generated/prisma';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // Create the Global Admin group if it doesn't exist
  const adminGroup = await prisma.group.upsert({
    where: { slug: 'global-admin' },
    update: {},
    create: {
      name: 'Global Admin',
      slug: 'global-admin',
      description: 'Group for super administrators of the entire application.',
      // A unique value is required for idTree, using slug for simplicity
      idTree: 'global-admin',
    },
  });
  console.log(`Created/found group '${adminGroup.name}' with id: ${adminGroup.id}`);

  // Create the 'joe' user if he doesn't exist
  const hashedPassword = await bcrypt.hash('password123', 10); // Replace with a secure password
  const joeUser = await prisma.user.upsert({
    where: { username: 'joe' },
    update: {},
    create: {
      username: 'joe',
      firstName: 'Joe',
      password: hashedPassword,
    },
  });
  console.log(`Created/found user '${joeUser.username}' with id: ${joeUser.id}`);

  // Add 'joe' to the 'Global Admin' group as a 'super' user
  const membership = await prisma.groupUser.upsert({
    where: {
      userId_groupId: {
        userId: joeUser.id,
        groupId: adminGroup.id,
      },
    },
    update: {
      role: GroupUserRole.super,
    },
    create: {
      userId: joeUser.id,
      groupId: adminGroup.id,
      role: GroupUserRole.super,
    },
  });
  console.log(`Ensured user '${joeUser.username}' is a '${membership.role}' in group '${adminGroup.name}'.`);

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
