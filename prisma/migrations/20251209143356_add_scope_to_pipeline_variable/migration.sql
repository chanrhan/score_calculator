-- AlterTable
ALTER TABLE "pipeline_variable" ADD COLUMN IF NOT EXISTS "scope" TEXT NOT NULL DEFAULT '0';

