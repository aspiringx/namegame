/*
  Warnings:

  - You are about to drop the column `groupId` on the `user_users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user1Id,user2Id,relationTypeId]` on the table `user_users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "user_users" DROP CONSTRAINT "user_users_groupId_fkey";

-- DropIndex
DROP INDEX "user_users_user1Id_user2Id_relationTypeId_groupId_key";

-- AlterTable
ALTER TABLE "user_users" DROP COLUMN "groupId";

-- CreateIndex
CREATE UNIQUE INDEX "user_users_user1Id_user2Id_relationTypeId_key" ON "user_users"("user1Id", "user2Id", "relationTypeId");
