-- CreateEnum
CREATE TYPE "ScanFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_BREACH', 'SCAN_COMPLETE', 'SCAN_ERROR');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "BreachStatus" AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED');

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "scanFrequency" "ScanFrequency" NOT NULL DEFAULT 'DAILY',
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Breach" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "domain" TEXT,
    "breachDate" TIMESTAMP(3),
    "addedDate" TIMESTAMP(3),
    "pwnCount" INTEGER,
    "description" TEXT,
    "dataClasses" TEXT[],
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "emailSentAt" TIMESTAMP(3),
    "status" "BreachStatus" NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "Breach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "emailsScanned" INTEGER NOT NULL DEFAULT 0,
    "newBreaches" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'RUNNING',

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "hibpApiKeyEncrypted" TEXT,
    "resendApiKeyEncrypted" TEXT,
    "notificationEmail" TEXT,
    "dailyScanHour" INTEGER NOT NULL DEFAULT 6,
    "dailyScanMinute" INTEGER NOT NULL DEFAULT 0,
    "weeklyScanDay" INTEGER NOT NULL DEFAULT 1,
    "weeklyScanHour" INTEGER NOT NULL DEFAULT 6,
    "weeklyScanMinute" INTEGER NOT NULL DEFAULT 0,
    "monthlyScanDay" INTEGER NOT NULL DEFAULT 1,
    "monthlyScanHour" INTEGER NOT NULL DEFAULT 6,
    "monthlyScanMinute" INTEGER NOT NULL DEFAULT 0,
    "hibpSubscriptionName" TEXT,
    "hibpDescription" TEXT,
    "hibpSubscribedUntil" TIMESTAMP(3),
    "hibpRpm" INTEGER,
    "hibpDomainSearchMax" INTEGER,
    "hibpIncludesStealerLogs" BOOLEAN NOT NULL DEFAULT false,
    "hibpSubscriptionUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Email_address_key" ON "Email"("address");

-- CreateIndex
CREATE INDEX "Breach_emailId_idx" ON "Breach"("emailId");

-- CreateIndex
CREATE INDEX "Breach_emailSentAt_idx" ON "Breach"("emailSentAt");

-- CreateIndex
CREATE INDEX "Breach_status_idx" ON "Breach"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Breach_emailId_name_key" ON "Breach"("emailId", "name");

-- CreateIndex
CREATE INDEX "Notification_emailId_idx" ON "Notification"("emailId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- AddForeignKey
ALTER TABLE "Breach" ADD CONSTRAINT "Breach_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
