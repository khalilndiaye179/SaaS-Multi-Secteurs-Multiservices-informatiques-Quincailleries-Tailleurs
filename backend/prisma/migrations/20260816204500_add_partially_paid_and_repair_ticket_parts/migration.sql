-- AlterEnum
ALTER TYPE "BillingDocumentStatus" ADD VALUE 'PARTIALLY_PAID';

-- CreateTable
CREATE TABLE "repair_ticket_parts" (
    "id" TEXT NOT NULL,
    "repairTicketId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "repair_ticket_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repair_ticket_parts_repairTicketId_idx" ON "repair_ticket_parts"("repairTicketId");

-- CreateIndex
CREATE INDEX "repair_ticket_parts_stockItemId_idx" ON "repair_ticket_parts"("stockItemId");

-- AddForeignKey
ALTER TABLE "repair_ticket_parts" ADD CONSTRAINT "repair_ticket_parts_repairTicketId_fkey" FOREIGN KEY ("repairTicketId") REFERENCES "repair_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repair_ticket_parts" ADD CONSTRAINT "repair_ticket_parts_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
