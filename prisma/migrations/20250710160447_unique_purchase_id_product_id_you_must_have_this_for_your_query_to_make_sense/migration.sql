/*
  Warnings:

  - A unique constraint covering the columns `[purchaseId,productId]` on the table `PurchaseItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PurchaseItem_purchaseId_productId_key" ON "PurchaseItem"("purchaseId", "productId");
