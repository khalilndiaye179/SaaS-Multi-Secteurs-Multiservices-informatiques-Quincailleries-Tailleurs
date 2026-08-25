-- AlterTable
ALTER TABLE "users" ADD COLUMN     "totpBackupCodesHashed" TEXT[],
ADD COLUMN     "totpEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totpSecret" TEXT,
ADD COLUMN     "totpSessionId" TEXT;

-- CreateTable
CREATE TABLE "platform_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enforce2FA" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("id")
);
