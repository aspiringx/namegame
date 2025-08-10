// prisma/scripts/prod-migration-step3-finalize-schema.ts
import { PrismaClient } from '../../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Step 3: Finalizing schema...')
  console.log(
    'WARNING: This is a destructive action. It will drop old columns and types. Ensure you have a backup.',
  )

  // Use a transaction to ensure all steps succeed or none do.
  await prisma.$transaction([
    // Step 3a: Add foreign key constraints
    prisma.$executeRaw`ALTER TABLE "groups" ADD CONSTRAINT "groups_groupTypeId_fkey" FOREIGN KEY ("groupTypeId") REFERENCES "group_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
    prisma.$executeRaw`ALTER TABLE "user_users" ADD CONSTRAINT "user_users_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "user_user_relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
    prisma.$executeRaw`ALTER TABLE "group_users" ADD CONSTRAINT "group_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "group_user_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
    prisma.$executeRaw`ALTER TABLE "photos" ADD CONSTRAINT "photos_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
    prisma.$executeRaw`ALTER TABLE "photos" ADD CONSTRAINT "photos_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "photo_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,
    prisma.$executeRaw`ALTER TABLE "messages" ADD CONSTRAINT "messages_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;`,

    // Step 3b: Make the new columns non-nullable
    prisma.$executeRaw`ALTER TABLE "groups" ALTER COLUMN "groupTypeId" SET NOT NULL;`,
    prisma.$executeRaw`ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" SET NOT NULL;`,
    prisma.$executeRaw`ALTER TABLE "group_users" ALTER COLUMN "roleId" SET NOT NULL;`,
    prisma.$executeRaw`ALTER TABLE "photos" ALTER COLUMN "entityTypeId" SET NOT NULL;`,
    prisma.$executeRaw`ALTER TABLE "photos" ALTER COLUMN "typeId" SET NOT NULL;`,
    prisma.$executeRaw`ALTER TABLE "messages" ALTER COLUMN "entityTypeId" SET NOT NULL;`,

    // Step 3c: Drop the old enum columns
    prisma.$executeRaw`ALTER TABLE "user_users" DROP COLUMN "relationType";`,
    prisma.$executeRaw`ALTER TABLE "group_users" DROP COLUMN "role";`,
    prisma.$executeRaw`ALTER TABLE "photos" DROP COLUMN "entityType";`,
    prisma.$executeRaw`ALTER TABLE "photos" DROP COLUMN "type";`,
    prisma.$executeRaw`ALTER TABLE "messages" DROP COLUMN "entityType";`,

    // Step 3d: Drop the old enum types
    prisma.$executeRaw`DROP TYPE "UserUserRelationType";`,
    prisma.$executeRaw`DROP TYPE "GroupUserRole";`,
    prisma.$executeRaw`DROP TYPE "EntityType";`,
    prisma.$executeRaw`DROP TYPE "PhotoType";`,
  ])

  console.log('Step 3 finished successfully.')
  console.log('Production migration is complete.')
}

main()
  .catch((e) => {
    console.error(
      'An error occurred during the transaction. No changes were made.',
    )
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
