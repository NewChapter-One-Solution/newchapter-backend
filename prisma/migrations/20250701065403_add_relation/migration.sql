/*
  Warnings:

  - You are about to drop the column `attendees` on the `Shop` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Shop" DROP COLUMN "attendees";

-- CreateTable
CREATE TABLE "_ShopAttendees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ShopAttendees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ShopAttendees_B_index" ON "_ShopAttendees"("B");

-- AddForeignKey
ALTER TABLE "_ShopAttendees" ADD CONSTRAINT "_ShopAttendees_A_fkey" FOREIGN KEY ("A") REFERENCES "Shop"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ShopAttendees" ADD CONSTRAINT "_ShopAttendees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
