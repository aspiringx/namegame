/*
  Warnings:

  - You are about to drop the column `pin` on the `users` table. All the data in the column will be lost.
  - Added the required column `password` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserUserRelationType" AS ENUM ('acquaintance', 'friend', 'family');

-- CreateEnum
CREATE TYPE "GroupUserRole" AS ENUM ('owner', 'admin', 'member');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "pin",
ADD COLUMN     "password" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "user_users" (
    "user1Id" INTEGER NOT NULL,
    "user2Id" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "greetCount" INTEGER NOT NULL DEFAULT 0,
    "relationType" "UserUserRelationType" NOT NULL DEFAULT 'acquaintance',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_users_pkey" PRIMARY KEY ("user1Id","user2Id","groupId")
);

-- CreateTable
CREATE TABLE "group_users" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "role" "GroupUserRole" NOT NULL DEFAULT 'member',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "group_users_pkey" PRIMARY KEY ("userId","groupId")
);

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_users" ADD CONSTRAINT "user_users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
