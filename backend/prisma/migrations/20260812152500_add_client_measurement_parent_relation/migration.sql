-- AlterTable
ALTER TABLE "client_measurements" ADD COLUMN "parentMeasurementId" TEXT;

-- CreateIndex
CREATE INDEX "client_measurements_parentMeasurementId_idx" ON "client_measurements"("parentMeasurementId");

-- AddForeignKey
ALTER TABLE "client_measurements" ADD CONSTRAINT "client_measurements_parentMeasurementId_fkey" FOREIGN KEY ("parentMeasurementId") REFERENCES "client_measurements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
