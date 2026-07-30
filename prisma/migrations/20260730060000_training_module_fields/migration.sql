-- AlterTable
ALTER TABLE "TrainingModule" ADD COLUMN     "videoDuration" TEXT,
ADD COLUMN     "mandatory" BOOLEAN NOT NULL DEFAULT true;
