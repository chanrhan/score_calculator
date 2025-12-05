-- CreateTable
CREATE TABLE "public"."block" (
    "pipeline_id" BIGINT NOT NULL,
    "component_id" INTEGER NOT NULL,
    "block_id" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "block_type" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "body_cells" JSONB,
    "header_cells" JSONB,

    CONSTRAINT "block_pkey" PRIMARY KEY ("pipeline_id","component_id","block_id")
);

-- CreateIndex
CREATE INDEX "block_pipeline_id_component_id_order_idx" ON "public"."block"("pipeline_id", "component_id", "order");

-- CreateIndex
CREATE INDEX "block_block_type_idx" ON "public"."block"("block_type");

-- AddForeignKey
ALTER TABLE "public"."block" ADD CONSTRAINT "block_pipeline_id_component_id_fkey" FOREIGN KEY ("pipeline_id", "component_id") REFERENCES "public"."component_grid"("pipeline_id", "component_id") ON DELETE CASCADE ON UPDATE CASCADE;

