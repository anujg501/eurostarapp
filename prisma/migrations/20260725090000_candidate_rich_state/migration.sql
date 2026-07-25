-- Candidate: rich LMS state (display id + JSON blob of screening/test/onboarding).
ALTER TABLE "Candidate" ADD COLUMN "candId" TEXT;
ALTER TABLE "Candidate" ADD COLUMN "data" TEXT;
CREATE UNIQUE INDEX "Candidate_candId_key" ON "Candidate"("candId");
