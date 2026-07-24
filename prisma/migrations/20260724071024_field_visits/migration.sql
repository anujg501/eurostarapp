-- CreateTable
CREATE TABLE "FieldVisit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "repId" TEXT NOT NULL,
    "repName" TEXT,
    "custId" TEXT NOT NULL,
    "custName" TEXT,
    "custCity" TEXT,
    "custMobile" TEXT,
    "day" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inLat" DOUBLE PRECISION,
    "inLng" DOUBLE PRECISION,
    "inAcc" DOUBLE PRECISION,
    "inSource" TEXT,
    "checkOutAt" TIMESTAMP(3),
    "outLat" DOUBLE PRECISION,
    "outLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FieldVisit_repId_day_idx" ON "FieldVisit"("repId", "day");

-- CreateIndex
CREATE INDEX "FieldVisit_day_idx" ON "FieldVisit"("day");
