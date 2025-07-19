-- Step 1: Create new code tables
CREATE TABLE "user_user_relation_types" (
    "id" TEXT NOT NULL,
    CONSTRAINT "user_user_relation_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_user_relation_types_id_key" ON "user_user_relation_types"("id");

CREATE TABLE "group_user_roles" (
    "id" TEXT NOT NULL,
    CONSTRAINT "group_user_roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_user_roles_id_key" ON "group_user_roles"("id");

CREATE TABLE "entity_types" (
    "id" TEXT NOT NULL,
    CONSTRAINT "entity_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "entity_types_id_key" ON "entity_types"("id");

CREATE TABLE "photo_types" (
    "id" TEXT NOT NULL,
    CONSTRAINT "photo_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "photo_types_id_key" ON "photo_types"("id");

-- Step 2: Seed the new code tables with data from the old enums
INSERT INTO "user_user_relation_types" ("id") VALUES
('acquaintance'),
('friend'),
('family');

INSERT INTO "group_user_roles" ("id") VALUES
('admin'),
('member'),
('super'),
('guest');

INSERT INTO "entity_types" ("id") VALUES
('group'),
('user');

INSERT INTO "photo_types" ("id") VALUES
('logo'),
('primary'),
('other');

-- Step 3: Add temporary nullable columns to hold the new foreign keys
ALTER TABLE "user_users" ADD COLUMN "relationTypeId" TEXT;
ALTER TABLE "group_users" ADD COLUMN "roleId" TEXT;
ALTER TABLE "photos" ADD COLUMN "entityTypeId" TEXT;
ALTER TABLE "photos" ADD COLUMN "typeId" TEXT;
ALTER TABLE "messages" ADD COLUMN "entityTypeId" TEXT;

-- Step 4: Copy data from old enum columns to new foreign key columns
-- This is safe because the enum values are text-compatible
UPDATE "user_users" SET "relationTypeId" = "relationType"::text;
UPDATE "group_users" SET "roleId" = "role"::text;
UPDATE "photos" SET "entityTypeId" = "entityType"::text;
UPDATE "photos" SET "typeId" = "type"::text;
UPDATE "messages" SET "entityTypeId" = "entityType"::text;

-- Step 5: Drop the old enum columns
ALTER TABLE "user_users" DROP COLUMN "relationType";
ALTER TABLE "group_users" DROP COLUMN "role";
ALTER TABLE "photos" DROP COLUMN "entityType";
ALTER TABLE "photos" DROP COLUMN "type";
ALTER TABLE "messages" DROP COLUMN "entityType";

-- Step 6: Make the new foreign key columns non-nullable and add defaults
ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" SET NOT NULL;
ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" SET DEFAULT 'acquaintance';

ALTER TABLE "group_users" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "group_users" ALTER COLUMN "roleId" SET DEFAULT 'guest';

ALTER TABLE "photos" ALTER COLUMN "entityTypeId" SET NOT NULL;
ALTER TABLE "photos" ALTER COLUMN "typeId" SET NOT NULL;
ALTER TABLE "photos" ALTER COLUMN "typeId" SET DEFAULT 'other';

ALTER TABLE "messages" ALTER COLUMN "entityTypeId" SET NOT NULL;

-- Step 7: Add foreign key constraints
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "user_user_relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "group_user_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "photos" ADD CONSTRAINT "photos_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "photo_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 8: Drop the old enum types
DROP TYPE "UserUserRelationType";
DROP TYPE "GroupUserRole";
DROP TYPE "EntityType";
DROP TYPE "PhotoType";
