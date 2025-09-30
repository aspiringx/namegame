-- DropIndex
DROP INDEX "codes_userId_groupId_key";

-- CreateIndex
CREATE INDEX "codes_userId_groupId_idx" ON "codes"("userId", "groupId");
