/*
  Warnings:

  - You are about to drop the column `updatedAt` on the `codes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "codes" DROP COLUMN "updatedAt";

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "parentId" INTEGER;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "groups"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
