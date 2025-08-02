/*
  Warnings:

  - Added the required column `imageDetails` to the `Products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Products" ADD COLUMN     "imageDetails" JSONB NOT NULL,
ADD COLUMN     "material" TEXT,
ADD COLUMN     "weight" TEXT;
