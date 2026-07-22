-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT '',
    "mobile" TEXT NOT NULL DEFAULT '',
    "gst" TEXT NOT NULL DEFAULT '',
    "rep" TEXT NOT NULL DEFAULT '',
    "stage" INTEGER NOT NULL DEFAULT 1,
    "followUp" TEXT NOT NULL DEFAULT '',
    "assigned" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL DEFAULT '',
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "flagName" TEXT NOT NULL DEFAULT '',
    "flagBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_flagged_idx" ON "Lead"("flagged");

-- CreateIndex
CREATE INDEX "Lead_rep_idx" ON "Lead"("rep");
