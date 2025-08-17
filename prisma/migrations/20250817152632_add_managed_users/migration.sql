-- CreateEnum
CREATE TYPE "ManagedStatus" AS ENUM ('full', 'partial');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "managed" "ManagedStatus";

-- CreateTable
CREATE TABLE "managed_users" (
    "managerId" TEXT NOT NULL,
    "managedId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "managed_users_pkey" PRIMARY KEY ("managerId","managedId")
);

-- AddForeignKey
ALTER TABLE "managed_users" ADD CONSTRAINT "managed_users_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "managed_users" ADD CONSTRAINT "managed_users_managedId_fkey" FOREIGN KEY ("managedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
