import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { backfillQuestionVersions } from "../src/lib/questions/version-backfill";

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required to backfill question versions.");
  return databaseUrl;
}

async function backfill() {
  const adapter = new PrismaPg({ connectionString: getDatabaseUrl() });
  const prisma = new PrismaClient({ adapter });

  try {
    const stats = await backfillQuestionVersions(prisma);
    console.info(JSON.stringify(stats, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

backfill().catch((error: unknown) => {
  console.error("Question version backfill failed.", error);
  process.exitCode = 1;
});
