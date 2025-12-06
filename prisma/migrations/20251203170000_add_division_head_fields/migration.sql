-- AlterTable
ALTER TABLE "component_grid" ADD COLUMN IF NOT EXISTS "division_head_header" JSONB;
ALTER TABLE "component_grid" ADD COLUMN IF NOT EXISTS "division_head_body" JSONB;
ALTER TABLE "component_grid" ADD COLUMN IF NOT EXISTS "division_head_active" BOOLEAN DEFAULT true;

