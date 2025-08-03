/*
  Warnings:

  - A unique constraint covering the columns `[shopId,productId]` on the table `Inventory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Inventory_shopId_productId_key" ON "Inventory"("shopId", "productId");
