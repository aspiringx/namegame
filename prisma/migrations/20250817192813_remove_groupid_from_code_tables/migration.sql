/*
  Warnings:

  - You are about to drop the column `groupId` on the `entity_types` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `group_user_roles` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `photo_types` table. All the data in the column will be lost.
  - You are about to drop the column `groupId` on the `user_user_relation_types` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `entity_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `group_user_roles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code]` on the table `photo_types` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[code,category]` on the table `user_user_relation_types` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "entity_types" DROP CONSTRAINT "entity_types_groupId_fkey";

-- DropForeignKey
ALTER TABLE "group_user_roles" DROP CONSTRAINT "group_user_roles_groupId_fkey";

-- DropForeignKey
ALTER TABLE "photo_types" DROP CONSTRAINT "photo_types_groupId_fkey";

-- DropForeignKey
ALTER TABLE "user_user_relation_types" DROP CONSTRAINT "user_user_relation_types_groupId_fkey";

-- DropIndex
DROP INDEX "entity_types_code_groupId_key";

-- DropIndex
DROP INDEX "group_user_roles_code_groupId_key";

-- DropIndex
DROP INDEX "photo_types_code_groupId_key";

-- DropIndex
DROP INDEX "user_user_relation_types_code_category_groupId_key";

-- AlterTable
ALTER TABLE "entity_types" DROP COLUMN "groupId";

-- AlterTable
ALTER TABLE "group_user_roles" DROP COLUMN "groupId";

-- AlterTable
ALTER TABLE "photo_types" DROP COLUMN "groupId";

-- AlterTable
ALTER TABLE "user_user_relation_types" DROP COLUMN "groupId";

-- CreateIndex
CREATE UNIQUE INDEX "entity_types_code_key" ON "entity_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "group_user_roles_code_key" ON "group_user_roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "photo_types_code_key" ON "photo_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_user_relation_types_code_category_key" ON "user_user_relation_types"("code", "category");
