-- Step 1: Create all new code tables with their final structure.

-- CreateTable: group_types
CREATE TABLE "group_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "group_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_types_code_key" ON "group_types"("code");

-- CreateTable: user_user_relation_types
CREATE TABLE "user_user_relation_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" INTEGER,

    CONSTRAINT "user_user_relation_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_user_relation_types_code_groupId_key" ON "user_user_relation_types"("code", "groupId");

-- CreateTable: group_user_roles
CREATE TABLE "group_user_roles" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" INTEGER,

    CONSTRAINT "group_user_roles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_user_roles_code_groupId_key" ON "group_user_roles"("code", "groupId");

-- CreateTable: entity_types
CREATE TABLE "entity_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" INTEGER,

    CONSTRAINT "entity_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "entity_types_code_groupId_key" ON "entity_types"("code", "groupId");

-- CreateTable: photo_types
CREATE TABLE "photo_types" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "groupId" INTEGER,

    CONSTRAINT "photo_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "photo_types_code_groupId_key" ON "photo_types"("code", "groupId");


-- Step 2: Add all new foreign key columns as nullable integers, without constraints.

-- AlterTable: groups
ALTER TABLE "groups" ADD COLUMN "groupTypeId" INTEGER;

-- AlterTable: user_users
ALTER TABLE "user_users" ADD COLUMN "relationTypeId" INTEGER;

-- AlterTable: group_users
ALTER TABLE "group_users" ADD COLUMN "roleId" INTEGER;

-- AlterTable: photos
ALTER TABLE "photos" ADD COLUMN "entityTypeId" INTEGER;
ALTER TABLE "photos" ADD COLUMN "typeId" INTEGER;

-- AlterTable: messages
ALTER TABLE "messages" ADD COLUMN "entityTypeId" INTEGER;
