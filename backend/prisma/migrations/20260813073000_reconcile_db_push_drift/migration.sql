-- CreateEnum
CREATE TYPE "PurchaseOrderStatus" AS ENUM ('PENDING', 'RECEIVED', 'CANCELLED');
-- AlterTable
ALTER TABLE "invoice_lines" ALTER COLUMN "vatRate" SET DEFAULT 18;
-- AlterTable
ALTER TABLE "quote_lines" ALTER COLUMN "vatRate" SET DEFAULT 18;
-- CreateTable
CREATE TABLE "tailleur_catalog_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Traditionnel',
    "estimatedPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "delaysDays" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,
    "fabricRecommendation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tailleur_catalog_items_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "tailleur_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "garmentType" TEXT NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tailleur_order_items_pkey" PRIMARY KEY ("id")
);
-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "supplierName" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "stockItemId" TEXT,
    "qtyOrdered" INTEGER NOT NULL,
    "totalCostXOF" DOUBLE PRECISION NOT NULL,
    "status" "PurchaseOrderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE INDEX "tailleur_catalog_items_tenantId_idx" ON "tailleur_catalog_items"("tenantId");
-- CreateIndex
CREATE INDEX "tailleur_order_items_orderId_idx" ON "tailleur_order_items"("orderId");
-- CreateIndex
CREATE INDEX "purchase_orders_tenantId_idx" ON "purchase_orders"("tenantId");
-- CreateIndex
CREATE INDEX "purchase_orders_status_idx" ON "purchase_orders"("status");
-- AddForeignKey
ALTER TABLE "tailleur_catalog_items" ADD CONSTRAINT "tailleur_catalog_items_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "tailleur_order_items" ADD CONSTRAINT "tailleur_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "tailleur_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "stock_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
