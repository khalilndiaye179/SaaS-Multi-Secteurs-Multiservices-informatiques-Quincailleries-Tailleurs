-- CreateTable
CREATE TABLE "it_service_packages" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "estimatedHours" TEXT NOT NULL,
    "priceXOF" DOUBLE PRECISION NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "it_service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "it_service_packages_tenantId_idx" ON "it_service_packages"("tenantId");

-- AddForeignKey
ALTER TABLE "it_service_packages" ADD CONSTRAINT "it_service_packages_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
