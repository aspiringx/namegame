/*
  Warnings:

  - The `type` column on the `photos` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('logo', 'primary', 'other');

-- AlterTable
ALTER TABLE "photos" DROP COLUMN "type",
ADD COLUMN     "type" "PhotoType" NOT NULL DEFAULT 'other';
