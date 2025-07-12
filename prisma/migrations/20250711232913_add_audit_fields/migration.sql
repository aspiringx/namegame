/*
  Warnings:

  - Made the column `createdById` on table `groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedById` on table `groups` required. This step will fail if there are existing NULL values in that column.
  - Made the column `createdById` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `updatedById` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_createdById_fkey";

-- DropForeignKey
ALTER TABLE "groups" DROP CONSTRAINT "groups_updatedById_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_createdById_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_updatedById_fkey";

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "updatedById" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "updatedById" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
