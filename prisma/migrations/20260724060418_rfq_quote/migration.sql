-- AlterTable
ALTER TABLE "Rfq" ADD COLUMN     "quoteAmount" INTEGER,
ADD COLUMN     "quoteNote" TEXT,
ADD COLUMN     "quotedAt" TIMESTAMP(3),
ADD COLUMN     "quotedById" TEXT;

-- AddForeignKey
ALTER TABLE "Rfq" ADD CONSTRAINT "Rfq_quotedById_fkey" FOREIGN KEY ("quotedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
