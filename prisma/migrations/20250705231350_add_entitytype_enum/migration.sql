/*
  Warnings:

  - Changed the type of `entityType` on the `messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `entityType` on the `photos` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('group', 'user');

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "EntityType" NOT NULL;

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "entityType",
ADD COLUMN     "entityType" "EntityType" NOT NULL;
