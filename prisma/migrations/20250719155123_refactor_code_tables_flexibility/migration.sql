-- Step 1: Drop existing foreign keys before changing the primary keys they reference.
ALTER TABLE "group_users" DROP CONSTRAINT "group_users_roleId_fkey";
ALTER TABLE "messages" DROP CONSTRAINT "messages_entityTypeId_fkey";
ALTER TABLE "photos" DROP CONSTRAINT "photos_entityTypeId_fkey";
ALTER TABLE "photos" DROP CONSTRAINT "photos_typeId_fkey";
ALTER TABLE "user_users" DROP CONSTRAINT "user_users_relationTypeId_fkey";

-- Step 2: Rename existing foreign key columns to temporarily hold the old string values.
ALTER TABLE "group_users" RENAME COLUMN "roleId" TO "roleId_old";
ALTER TABLE "messages" RENAME COLUMN "entityTypeId" TO "entityTypeId_old";
ALTER TABLE "photos" RENAME COLUMN "entityTypeId" TO "entityTypeId_old";
ALTER TABLE "photos" RENAME COLUMN "typeId" TO "typeId_old";
ALTER TABLE "user_users" RENAME COLUMN "relationTypeId" TO "relationTypeId_old";

-- Step 3: Rebuild the code tables with the new structure (integer PK, code column, etc.).
-- For each table, we add the new columns, copy the old ID to the new 'code' column,
-- then drop the old text-based ID and create a new serial integer ID.

-- Rebuild user_user_relation_types
ALTER TABLE "user_user_relation_types" ADD COLUMN "code" TEXT;
UPDATE "user_user_relation_types" SET "code" = "id";
ALTER TABLE "user_user_relation_types" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "user_user_relation_types" DROP CONSTRAINT "user_user_relation_types_pkey";
DROP INDEX "user_user_relation_types_id_key";
ALTER TABLE "user_user_relation_types" DROP COLUMN "id";
ALTER TABLE "user_user_relation_types" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "user_user_relation_types" ADD CONSTRAINT "user_user_relation_types_pkey" PRIMARY KEY ("id");
ALTER TABLE "user_user_relation_types" ADD COLUMN "groupId" INTEGER;

-- Rebuild group_user_roles
ALTER TABLE "group_user_roles" ADD COLUMN "code" TEXT;
UPDATE "group_user_roles" SET "code" = "id";
ALTER TABLE "group_user_roles" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "group_user_roles" DROP CONSTRAINT "group_user_roles_pkey";
DROP INDEX "group_user_roles_id_key";
ALTER TABLE "group_user_roles" DROP COLUMN "id";
ALTER TABLE "group_user_roles" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "group_user_roles" ADD CONSTRAINT "group_user_roles_pkey" PRIMARY KEY ("id");
ALTER TABLE "group_user_roles" ADD COLUMN "groupId" INTEGER;

-- Rebuild entity_types
ALTER TABLE "entity_types" ADD COLUMN "code" TEXT;
UPDATE "entity_types" SET "code" = "id";
ALTER TABLE "entity_types" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "entity_types" DROP CONSTRAINT "entity_types_pkey";
DROP INDEX "entity_types_id_key";
ALTER TABLE "entity_types" DROP COLUMN "id";
ALTER TABLE "entity_types" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "entity_types" ADD CONSTRAINT "entity_types_pkey" PRIMARY KEY ("id");
ALTER TABLE "entity_types" ADD COLUMN "groupId" INTEGER;

-- Rebuild photo_types
ALTER TABLE "photo_types" ADD COLUMN "code" TEXT;
UPDATE "photo_types" SET "code" = "id";
ALTER TABLE "photo_types" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "photo_types" DROP CONSTRAINT "photo_types_pkey";
DROP INDEX "photo_types_id_key";
ALTER TABLE "photo_types" DROP COLUMN "id";
ALTER TABLE "photo_types" ADD COLUMN "id" SERIAL NOT NULL;
ALTER TABLE "photo_types" ADD CONSTRAINT "photo_types_pkey" PRIMARY KEY ("id");
ALTER TABLE "photo_types" ADD COLUMN "groupId" INTEGER;

-- Step 4: Add the new integer-based foreign key columns (initially nullable).
ALTER TABLE "group_users" ADD COLUMN "roleId" INTEGER;
ALTER TABLE "messages" ADD COLUMN "entityTypeId" INTEGER;
ALTER TABLE "photos" ADD COLUMN "entityTypeId" INTEGER;
ALTER TABLE "photos" ADD COLUMN "typeId" INTEGER;
ALTER TABLE "user_users" ADD COLUMN "relationTypeId" INTEGER;

-- Step 5: Backfill the new integer FKs by joining with the rebuilt code tables.
UPDATE "group_users" u SET "roleId" = t.id FROM "group_user_roles" t WHERE u."roleId_old" = t.code;
UPDATE "messages" u SET "entityTypeId" = t.id FROM "entity_types" t WHERE u."entityTypeId_old" = t.code;
UPDATE "photos" u SET "entityTypeId" = t.id FROM "entity_types" t WHERE u."entityTypeId_old" = t.code;
UPDATE "photos" u SET "typeId" = t.id FROM "photo_types" t WHERE u."typeId_old" = t.code;
UPDATE "user_users" u SET "relationTypeId" = t.id FROM "user_user_relation_types" t WHERE u."relationTypeId_old" = t.code;

-- Step 6: Make new FK columns non-nullable and apply defaults.
ALTER TABLE "group_users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "group_users" ALTER COLUMN "roleId" SET DEFAULT 4;
ALTER TABLE "messages" ALTER COLUMN "entityTypeId" SET NOT NULL;
ALTER TABLE "photos" ALTER COLUMN "entityTypeId" SET NOT NULL;
ALTER TABLE "photos" ALTER COLUMN "typeId" SET NOT NULL;
ALTER TABLE "photos" ALTER COLUMN "typeId" SET DEFAULT 3;
ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" SET NOT NULL;
ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" SET DEFAULT 1;

-- Step 7: Drop the old temporary string-based columns.
ALTER TABLE "group_users" DROP COLUMN "roleId_old";
ALTER TABLE "messages" DROP COLUMN "entityTypeId_old";
ALTER TABLE "photos" DROP COLUMN "entityTypeId_old";
ALTER TABLE "photos" DROP COLUMN "typeId_old";
ALTER TABLE "user_users" DROP COLUMN "relationTypeId_old";

-- Step 8: Create new unique constraints and add foreign key constraints.
CREATE UNIQUE INDEX "entity_types_code_groupId_key" ON "entity_types"("code", "groupId");
CREATE UNIQUE INDEX "group_user_roles_code_groupId_key" ON "group_user_roles"("code", "groupId");
CREATE UNIQUE INDEX "photo_types_code_groupId_key" ON "photo_types"("code", "groupId");
CREATE UNIQUE INDEX "user_user_relation_types_code_groupId_key" ON "user_user_relation_types"("code", "groupId");

ALTER TABLE "user_users" ADD CONSTRAINT "user_users_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "user_user_relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "group_user_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "photo_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "user_user_relation_types" ADD CONSTRAINT "user_user_relation_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "group_user_roles" ADD CONSTRAINT "group_user_roles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "entity_types" ADD CONSTRAINT "entity_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "photo_types" ADD CONSTRAINT "photo_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
