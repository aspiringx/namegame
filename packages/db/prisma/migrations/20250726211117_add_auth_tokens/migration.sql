/*
  Warnings:

  - You are about to drop the column `role` on the `group_users` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `entityType` on the `photos` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `photos` table. All the data in the column will be lost.
  - You are about to drop the column `relationType` on the `user_users` table. All the data in the column will be lost.
  - Made the column `roleId` on table `group_users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `groupTypeId` on table `groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityTypeId` on table `messages` required. This step will fail if there are existing NULL values in that column.
  - Made the column `entityTypeId` on table `photos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `typeId` on table `photos` required. This step will fail if there are existing NULL values in that column.
  - Made the column `relationTypeId` on table `user_users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "group_users" DROP COLUMN "role",
ALTER COLUMN "roleId" SET NOT NULL,
ALTER COLUMN "roleId" SET DEFAULT 4;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "groupTypeId" SET NOT NULL,
ALTER COLUMN "groupTypeId" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "entityType",
ALTER COLUMN "entityTypeId" SET NOT NULL;

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "entityType",
DROP COLUMN "type",
ALTER COLUMN "entityTypeId" SET NOT NULL,
ALTER COLUMN "typeId" SET NOT NULL,
ALTER COLUMN "typeId" SET DEFAULT 3;

-- AlterTable
ALTER TABLE "user_users" DROP COLUMN "relationType",
ALTER COLUMN "relationTypeId" SET NOT NULL,
ALTER COLUMN "relationTypeId" SET DEFAULT 1;

-- DropEnum
DROP TYPE "EntityType";

-- DropEnum
DROP TYPE "GroupUserRole";

-- DropEnum
DROP TYPE "PhotoType";

-- DropEnum
DROP TYPE "UserUserRelationType";

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_email_token_key" ON "EmailVerificationToken"("email", "token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_email_token_key" ON "PasswordResetToken"("email", "token");

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_relationTypeId_fkey" FOREIGN KEY ("relationTypeId") REFERENCES "user_user_relation_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_groupTypeId_fkey" FOREIGN KEY ("groupTypeId") REFERENCES "group_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "group_user_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "photo_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_entityTypeId_fkey" FOREIGN KEY ("entityTypeId") REFERENCES "entity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_user_relation_types" ADD CONSTRAINT "user_user_relation_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_user_roles" ADD CONSTRAINT "group_user_roles_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entity_types" ADD CONSTRAINT "entity_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photo_types" ADD CONSTRAINT "photo_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
