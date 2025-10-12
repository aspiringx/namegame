-- AlterTable
ALTER TABLE "PushSubscription" ADD COLUMN "browser" TEXT,
ADD COLUMN "os" TEXT,
ADD COLUMN "deviceType" TEXT;

-- CreateIndex
CREATE INDEX "PushSubscription_userId_browser_os_deviceType_idx" ON "PushSubscription"("userId", "browser", "os", "deviceType");
