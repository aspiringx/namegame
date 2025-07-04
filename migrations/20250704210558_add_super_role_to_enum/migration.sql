-- This migration adds the 'super' value to the "GroupUserRole" enum.
-- It is necessary because the enum in the database is out of sync with the Prisma schema.
ALTER TYPE "GroupUserRole" ADD VALUE 'super';
