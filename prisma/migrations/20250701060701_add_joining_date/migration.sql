-- AlterTable
ALTER TABLE "Shop" ADD COLUMN     "attendees" TEXT[];

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "joinDate" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "Shop"("id") ON DELETE SET NULL ON UPDATE CASCADE;
