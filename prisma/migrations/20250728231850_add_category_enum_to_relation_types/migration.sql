/*
  Warnings:

  - Added the required column `category` to the `user_user_relation_types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserUserRelationCategory" AS ENUM ('family', 'other');

-- AlterTable
-- Step 1: Add the column as nullable
ALTER TABLE "user_user_relation_types" ADD COLUMN "category" "UserUserRelationCategory";

-- Step 2: Update existing rows to have the 'other' category by default
UPDATE "user_user_relation_types" SET "category" = 'other';

-- Step 3: Alter the column to be NOT NULL
ALTER TABLE "user_user_relation_types" ALTER COLUMN "category" SET NOT NULL;
