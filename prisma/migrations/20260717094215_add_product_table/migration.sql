-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cat" TEXT NOT NULL,
    "tone" TEXT NOT NULL DEFAULT '',
    "shape" TEXT NOT NULL DEFAULT '',
    "size" TEXT NOT NULL DEFAULT '',
    "clarity" TEXT NOT NULL DEFAULT '',
    "price" INTEGER NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'per pc',
    "moq" INTEGER NOT NULL DEFAULT 1,
    "stock" TEXT NOT NULL DEFAULT 'in',
    "stockCount" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT,
    "desc" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Product_cat_idx" ON "Product"("cat");
