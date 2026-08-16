-- CreateEnum
CREATE TYPE "BillingDocumentType" AS ENUM ('QUOTE', 'INVOICE');

-- AlterTable: Add vatRate to quote_lines
ALTER TABLE "quote_lines" ADD COLUMN "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Add vatRate to invoice_lines
ALTER TABLE "invoice_lines" ADD COLUMN "vatRate" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable: Rename quoteId to sourceQuoteId in invoices
ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_quoteId_fkey";
DROP INDEX IF EXISTS "invoices_quoteId_key";
ALTER TABLE "invoices" RENAME COLUMN "quoteId" TO "sourceQuoteId";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sourceQuoteId_key" UNIQUE ("sourceQuoteId");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sourceQuoteId_fkey" FOREIGN KEY ("sourceQuoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable: billing_sequences
CREATE TABLE "billing_sequences" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" "BillingDocumentType" NOT NULL,
    "currentValue" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "billing_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "billing_sequences_tenantId_year_type_key" ON "billing_sequences"("tenantId", "year", "type");

-- AddForeignKey
ALTER TABLE "billing_sequences" ADD CONSTRAINT "billing_sequences_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
