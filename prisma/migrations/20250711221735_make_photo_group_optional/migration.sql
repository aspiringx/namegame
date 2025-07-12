-- DropForeignKey
ALTER TABLE "photos" DROP CONSTRAINT "photos_groupId_fkey";

-- AlterTable
ALTER TABLE "photos" ALTER COLUMN "groupId" DROP NOT NULL,
ALTER COLUMN "entityId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
