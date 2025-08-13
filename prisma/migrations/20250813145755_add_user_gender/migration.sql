-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'non_binary');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "gender" "Gender";
