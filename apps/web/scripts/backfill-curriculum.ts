import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { runCurriculumBackfill } from "../src/lib/curriculum/taxonomy-backfill";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to backfill curriculum taxonomy.");
  return databaseUrl;
}

async function backfill() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    const stats = await runCurriculumBackfill(prisma);
    console.info(JSON.stringify(stats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

backfill().catch((error: unknown) => {
  console.error("Curriculum backfill failed.", error);
  process.exitCode = 1;
});
