-- AlterTable
ALTER TABLE "group_users" ALTER COLUMN "roleId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "groupTypeId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "photos" ALTER COLUMN "typeId" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_users" ALTER COLUMN "relationTypeId" DROP DEFAULT;
