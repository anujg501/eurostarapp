-- CreateTable
CREATE TABLE "TestQuestion" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "prompt" TEXT NOT NULL,
    "options" TEXT NOT NULL DEFAULT '[]',
    "answer" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestQuestion_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TestQuestion" ADD CONSTRAINT "TestQuestion_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "TrainingModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;
