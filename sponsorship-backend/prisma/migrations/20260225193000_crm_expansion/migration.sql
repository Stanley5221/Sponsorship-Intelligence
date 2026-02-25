-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED', 'NO_RESPONSE', 'WITHDRAWN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update Company table
ALTER TABLE "Company" 
ADD COLUMN IF NOT EXISTS "industry" TEXT,
ADD COLUMN IF NOT EXISTS "website" TEXT,
ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
ADD COLUMN IF NOT EXISTS "isExternal" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "createdBy" INTEGER;

-- Update Application table: renames
DO $$ BEGIN
    ALTER TABLE "Application" RENAME COLUMN "jobRole" TO "role";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Application" RENAME COLUMN "dateApplied" TO "appliedDate";
EXCEPTION
    WHEN undefined_column THEN null;
END $$;

-- Update Application table: type change for status
-- We convert existing text status to the new enum
ALTER TABLE "Application" 
ALTER COLUMN "status" TYPE "ApplicationStatus" 
USING (
    CASE 
        WHEN "status" = 'Applied' THEN 'APPLIED'::"ApplicationStatus"
        WHEN "status" = 'Interviewing' THEN 'INTERVIEW'::"ApplicationStatus"
        WHEN "status" = 'Offer' THEN 'OFFER'::"ApplicationStatus"
        WHEN "status" = 'Rejected' THEN 'REJECTED'::"ApplicationStatus"
        WHEN "status" = 'REJECTED' THEN 'REJECTED'::"ApplicationStatus"
        WHEN "status" = 'OFFER' THEN 'OFFER'::"ApplicationStatus"
        WHEN "status" = 'INTERVIEW' THEN 'INTERVIEW'::"ApplicationStatus"
        WHEN "status" = 'APPLIED' THEN 'APPLIED'::"ApplicationStatus"
        ELSE 'APPLIED'::"ApplicationStatus"
    END
);

ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'APPLIED';

-- Add remaining columns to Application
ALTER TABLE "Application"
ADD COLUMN IF NOT EXISTS "followUpCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "salary" TEXT,
ADD COLUMN IF NOT EXISTS "externalWebsite" TEXT;

-- CreateTable ApplicationUpdate
CREATE TABLE IF NOT EXISTS "ApplicationUpdate" (
    "id" SERIAL PRIMARY KEY,
    "applicationId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApplicationUpdate_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
