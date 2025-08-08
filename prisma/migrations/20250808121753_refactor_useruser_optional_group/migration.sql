/*
  Warnings:

  - The primary key for the `user_users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[user1Id,user2Id,relationTypeId,groupId]` on the table `user_users` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "user_users" DROP CONSTRAINT "user_users_groupId_fkey";

-- AlterTable
ALTER TABLE "user_users" DROP CONSTRAINT "user_users_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "groupId" DROP NOT NULL,
ADD CONSTRAINT "user_users_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "user_users_user1Id_user2Id_relationTypeId_groupId_key" ON "user_users"("user1Id", "user2Id", "relationTypeId", "groupId");

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
