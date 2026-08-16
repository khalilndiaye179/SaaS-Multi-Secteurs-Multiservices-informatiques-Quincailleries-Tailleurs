-- AlterEnum
ALTER TYPE "BillingStatus" ADD VALUE 'ARCHIVED';

-- AlterTable
ALTER TABLE "payment_proofs" ADD COLUMN     "appliedMonthlyPrice" DOUBLE PRECISION DEFAULT 6500,
ADD COLUMN     "expectedAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tenants" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "pricing_configs" (
    "id" TEXT NOT NULL,
    "baseMonthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 6500,
    "discount6Months" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "discount12Months" DOUBLE PRECISION NOT NULL DEFAULT 0.20,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "isDefault" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_configs_pkey" PRIMARY KEY ("id")
);
