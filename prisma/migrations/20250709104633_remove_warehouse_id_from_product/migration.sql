/*
  Warnings:

  - You are about to drop the column `warehouseId` on the `Products` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Products" DROP CONSTRAINT "Products_warehouseId_fkey";

-- AlterTable
ALTER TABLE "Products" DROP COLUMN "warehouseId",
ADD COLUMN     "warehousesId" TEXT;

-- AddForeignKey
ALTER TABLE "Products" ADD CONSTRAINT "Products_warehousesId_fkey" FOREIGN KEY ("warehousesId") REFERENCES "Warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
