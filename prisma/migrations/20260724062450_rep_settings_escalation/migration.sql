-- AlterTable
ALTER TABLE "User" ADD COLUMN     "asmId" TEXT,
ADD COLUMN     "commissionPct" DOUBLE PRECISION DEFAULT 4,
ADD COLUMN     "headId" TEXT,
ADD COLUMN     "monthlyTarget" INTEGER DEFAULT 50,
ADD COLUMN     "phoneNote" TEXT,
ADD COLUMN     "region" TEXT;

-- CreateTable
CREATE TABLE "EscalationContact" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EscalationContact_pkey" PRIMARY KEY ("id")
);
