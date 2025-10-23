-- AlterTable
ALTER TABLE "public"."chat_messages" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenBy" TEXT,
ADD COLUMN     "isHidden" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;

-- AddForeignKey
ALTER TABLE "public"."chat_messages" ADD CONSTRAINT "chat_messages_hiddenBy_fkey" FOREIGN KEY ("hiddenBy") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
