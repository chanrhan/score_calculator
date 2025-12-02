import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const createTableSQL = `
CREATE TABLE IF NOT EXISTS "pipeline_variable" (
  "univ_id" CHAR(3) NOT NULL,
  "pipeline_id" BIGINT NOT NULL,
  "variable_name" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL,
  CONSTRAINT "pipeline_variable_pkey" PRIMARY KEY ("pipeline_id", "variable_name"),
  CONSTRAINT "pipeline_variable_univ_id_fkey"
    FOREIGN KEY ("univ_id") REFERENCES "univ" ("id") ON DELETE CASCADE,
  CONSTRAINT "pipeline_variable_pipeline_id_fkey"
    FOREIGN KEY ("pipeline_id") REFERENCES "pipelines" ("id") ON DELETE CASCADE
);`;

  const createIndexSQL = `
CREATE INDEX IF NOT EXISTS "pipeline_variable_univ_id_pipeline_id_idx"
  ON "pipeline_variable" ("univ_id", "pipeline_id");`;

  await prisma.$executeRawUnsafe(createTableSQL);
  await prisma.$executeRawUnsafe(createIndexSQL);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log("pipeline_variable table ensured.");
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });


