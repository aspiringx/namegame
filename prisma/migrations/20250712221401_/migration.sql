/*
  Warnings:

  - You are about to drop the column `geo` on the `codes` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `codes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[code]` on the table `codes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,groupId]` on the table `codes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `codes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "codes_url_key";

-- DropIndex
DROP INDEX "codes_userId_groupId_geo_key";

-- AlterTable
ALTER TABLE "codes" DROP COLUMN "geo",
DROP COLUMN "url",
ADD COLUMN     "code" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "codes_code_key" ON "codes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "codes_userId_groupId_key" ON "codes"("userId", "groupId");
