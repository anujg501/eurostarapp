-- AlterTable
ALTER TABLE "ChatLog" ADD COLUMN     "app" TEXT NOT NULL DEFAULT 'sales',
ADD COLUMN     "contact" TEXT,
ADD COLUMN     "cust" TEXT,
ADD COLUMN     "who" TEXT;

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "gstinNorm" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "courier" TEXT,
ADD COLUMN     "track" TEXT;

-- CreateTable
CREATE TABLE "Rep" (
    "id" TEXT NOT NULL,
    "repId" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "state" TEXT,
    "source" TEXT,
    "tier" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hiredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "source" TEXT,
    "stage" TEXT NOT NULL DEFAULT 'applied',
    "score" INTEGER,
    "exp" TEXT,
    "repId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Practice" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "app" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Practice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingModule" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "videoUrl" TEXT,
    "checklist" TEXT NOT NULL DEFAULT '[]',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "active" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "title" TEXT,
    "message" TEXT,
    "badge" TEXT,
    "windowStart" TIMESTAMP(3),
    "windowEnd" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rep_repId_key" ON "Rep"("repId");

-- CreateIndex
CREATE INDEX "Candidate_stage_idx" ON "Candidate"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "Practice_candidateId_app_key" ON "Practice"("candidateId", "app");

-- CreateIndex
CREATE INDEX "ChatLog_app_idx" ON "ChatLog"("app");

-- CreateIndex
CREATE INDEX "Customer_gstinNorm_idx" ON "Customer"("gstinNorm");

-- AddForeignKey
ALTER TABLE "Practice" ADD CONSTRAINT "Practice_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
