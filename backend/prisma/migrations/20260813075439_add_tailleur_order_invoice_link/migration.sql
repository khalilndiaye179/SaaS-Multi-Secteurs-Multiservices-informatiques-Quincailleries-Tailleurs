-- AlterTable
ALTER TABLE "tailleur_orders" ADD COLUMN "invoiceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "tailleur_orders_invoiceId_key" ON "tailleur_orders"("invoiceId");

-- AddForeignKey
ALTER TABLE "tailleur_orders" ADD CONSTRAINT "tailleur_orders_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
