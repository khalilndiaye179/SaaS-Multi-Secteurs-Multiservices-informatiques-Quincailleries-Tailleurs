/*
  Warnings:

  - A unique constraint covering the columns `[transactionRef]` on the table `payment_proofs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_proofs_transactionRef_key" ON "payment_proofs"("transactionRef");
