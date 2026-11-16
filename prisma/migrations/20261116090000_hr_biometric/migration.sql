-- CreateTable
CREATE TABLE "BioDevice" (
    "id" TEXT NOT NULL,
    "sn" TEXT NOT NULL,
    "name" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "attlogStamp" TEXT,
    "operlogStamp" TEXT,
    "lastSeenAt" TIMESTAMP(3),
    "lastIp" TEXT,
    "pushVer" TEXT,
    "info" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BioPunch" (
    "id" TEXT NOT NULL,
    "deviceSn" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "ts" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" INTEGER,
    "verify" INTEGER,
    "raw" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BioPunch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BioUser" (
    "id" TEXT NOT NULL,
    "deviceSn" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "name" TEXT,
    "privilege" INTEGER,
    "card" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BioUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BioDevice_sn_key" ON "BioDevice"("sn");

-- CreateIndex
CREATE INDEX "BioPunch_date_idx" ON "BioPunch"("date");

-- CreateIndex
CREATE INDEX "BioPunch_pin_date_idx" ON "BioPunch"("pin", "date");

-- CreateIndex
CREATE UNIQUE INDEX "BioPunch_deviceSn_pin_ts_key" ON "BioPunch"("deviceSn", "pin", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "BioUser_deviceSn_pin_key" ON "BioUser"("deviceSn", "pin");
