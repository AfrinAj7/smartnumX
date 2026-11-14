import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Applying raw SQL partial unique index for active attempt...");
  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "unique_active_attempt"
    ON "Attempt" ("testId", "userId")
    WHERE "status" = 'IN_PROGRESS';
  `);
  console.log("Partial unique index created successfully!");
}

main()
  .catch((e) => {
    console.error("Error creating index:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

