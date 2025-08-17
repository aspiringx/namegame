/*
  Warnings:

  - A unique constraint covering the columns `[code,category,groupId]` on the table `user_user_relation_types` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "user_user_relation_types_code_groupId_key";

-- CreateIndex
CREATE UNIQUE INDEX "user_user_relation_types_code_category_groupId_key" ON "user_user_relation_types"("code", "category", "groupId");
