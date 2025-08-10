// prisma/scripts/prod-migration-step2-backfill-fks.ts
import { PrismaClient } from '../../src/generated/prisma'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting Step 2: Backfilling new foreign key columns...')

  // Note: We use raw SQL here because the Prisma schema is already updated and
  // does not know about the old ENUM columns that still exist in the database.

  console.log('Backfilling group_users.roleId...')
  await prisma.$executeRaw`UPDATE "group_users" SET "roleId" = gr.id FROM "group_user_roles" gr WHERE "group_users"."role"::text = gr.code;`

  console.log('Backfilling user_users.relationTypeId...')
  await prisma.$executeRaw`UPDATE "user_users" SET "relationTypeId" = urt.id FROM "user_user_relation_types" urt WHERE "user_users"."relationType"::text = urt.code;`

  console.log('Backfilling photos.typeId and photos.entityTypeId...')
  await prisma.$executeRaw`UPDATE "photos" SET "typeId" = pt.id FROM "photo_types" pt WHERE "photos"."type"::text = pt.code;`
  await prisma.$executeRaw`UPDATE "photos" SET "entityTypeId" = et.id FROM "entity_types" et WHERE "photos"."entityType"::text = et.code;`

  console.log('Backfilling messages.entityTypeId...')
  await prisma.$executeRaw`UPDATE "messages" SET "entityTypeId" = et.id FROM "entity_types" et WHERE "messages"."entityType"::text = et.code;`

  console.log('Backfilling groups.groupTypeId with default value...')
  // Default all existing groups to 'family' (id: 3)
  await prisma.$executeRaw`UPDATE "groups" SET "groupTypeId" = 3 WHERE "groupTypeId" IS NULL;`

  console.log('Step 2 finished successfully.')
  console.log(
    'IMPORTANT: Please verify the data in the new columns before proceeding to Step 3.',
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
