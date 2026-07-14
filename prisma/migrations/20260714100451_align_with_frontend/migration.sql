/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Sku` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `courier` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `grandTotal` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `gst` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `ts` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `grand` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tax` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Category_key_key";

-- DropIndex
DROP INDEX "Sku_categoryKey_grade_colour_shape_size_key";

-- DropIndex
DROP INDEX "Sku_categoryKey_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Category";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Sku";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "SoldOut" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "soldOut" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'shipment',
    "orderId" TEXT,
    "courier" TEXT,
    "track" TEXT,
    "title" TEXT,
    "body" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Notification" ("body", "createdAt", "customerId", "id", "kind", "read", "title") SELECT "body", "createdAt", "customerId", "id", "kind", "read", "title" FROM "Notification";
DROP TABLE "Notification";
ALTER TABLE "new_Notification" RENAME TO "Notification";
CREATE INDEX "Notification_customerId_idx" ON "Notification"("customerId");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "repUserId" TEXT,
    "customerName" TEXT,
    "customerCode" TEXT,
    "city" TEXT,
    "repName" TEXT,
    "repId" TEXT,
    "subtotal" INTEGER NOT NULL,
    "tax" INTEGER NOT NULL,
    "shipping" INTEGER NOT NULL,
    "insurance" INTEGER NOT NULL DEFAULT 0,
    "grand" INTEGER NOT NULL,
    "isExport" BOOLEAN NOT NULL DEFAULT false,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "dispatchBy" DATETIME,
    "dispatchByLabel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "source" TEXT NOT NULL DEFAULT 'Sales App',
    "queuedOffline" BOOLEAN NOT NULL DEFAULT false,
    "clientTs" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_repUserId_fkey" FOREIGN KEY ("repUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("city", "createdAt", "customerCode", "customerId", "customerName", "dispatchBy", "id", "repId", "repName", "repUserId", "source", "status", "subtotal", "updatedAt") SELECT "city", "createdAt", "customerCode", "customerId", "customerName", "dispatchBy", "id", "repId", "repName", "repUserId", "source", "status", "subtotal", "updatedAt" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE TABLE "new_Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT,
    "customerId" TEXT,
    "custId" TEXT,
    "custCode" TEXT,
    "custName" TEXT,
    "mode" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "utr" TEXT,
    "date" TEXT,
    "by" TEXT,
    "contact" TEXT,
    "img" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "source" TEXT NOT NULL DEFAULT 'Sales App',
    "receivedById" TEXT,
    "loggedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Payment" ("amount", "custCode", "custName", "customerId", "id", "mode", "orderId", "receivedById", "status", "utr") SELECT "amount", "custCode", "custName", "customerId", "id", "mode", "orderId", "receivedById", "status", "utr" FROM "Payment";
DROP TABLE "Payment";
ALTER TABLE "new_Payment" RENAME TO "Payment";
CREATE INDEX "Payment_orderId_idx" ON "Payment"("orderId");
CREATE INDEX "Payment_customerId_idx" ON "Payment"("customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
