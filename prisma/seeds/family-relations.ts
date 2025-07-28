import { PrismaClient, UserUserRelationCategory } from '../../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding family relationship types...');

  const seedRelationType = async (code: string, category: UserUserRelationCategory) => {
    const existing = await prisma.userUserRelationType.findFirst({
      where: { code, groupId: null },
    });

    if (!existing) {
      await prisma.userUserRelationType.create({
        data: { code, category },
      });
      console.log(`  Created '${code}' relation type.`);
    } else {
      console.log(`  '${code}' relation type already exists.`);
    }
  };

  await seedRelationType('parent', UserUserRelationCategory.family);
  await seedRelationType('spouse', UserUserRelationCategory.family);

  console.log('Family relationship types seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
