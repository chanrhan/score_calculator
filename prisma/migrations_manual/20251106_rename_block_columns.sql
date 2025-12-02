BEGIN;
ALTER TABLE "public"."block" RENAME COLUMN "header_cells" TO "header";
ALTER TABLE "public"."block" RENAME COLUMN "body_cells" TO "body";
COMMIT;


