-- DropForeignKey
ALTER TABLE "public"."codes" DROP CONSTRAINT "codes_groupId_fkey";

-- CreateTable
CREATE TABLE "public"."ai_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestInput" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT NOT NULL,
    "response" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "conversationId" TEXT,
    "parentRequestId" TEXT,
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "creditsUsed" INTEGER,
    "processingTimeMs" INTEGER,
    "error" TEXT,

    CONSTRAINT "ai_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_requests_userId_requestedAt_idx" ON "public"."ai_requests"("userId", "requestedAt");

-- CreateIndex
CREATE INDEX "ai_requests_requestType_idx" ON "public"."ai_requests"("requestType");

-- CreateIndex
CREATE INDEX "ai_requests_conversationId_idx" ON "public"."ai_requests"("conversationId");

-- AddForeignKey
ALTER TABLE "public"."codes" ADD CONSTRAINT "codes_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_requests" ADD CONSTRAINT "ai_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ai_requests" ADD CONSTRAINT "ai_requests_parentRequestId_fkey" FOREIGN KEY ("parentRequestId") REFERENCES "public"."ai_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
