-- AlterTable
ALTER TABLE "users" ADD COLUMN     "birthPlace" TEXT,
ADD COLUMN     "deathDate" TIMESTAMP(3),
ADD COLUMN     "deathDatePrecision" "DatePrecision",
ADD COLUMN     "deathPlace" TEXT;
