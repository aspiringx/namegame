-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_createdById_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_updatedById_fkey";

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "createdById" DROP NOT NULL,
ALTER COLUMN "updatedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
