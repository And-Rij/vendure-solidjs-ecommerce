import { env } from "../config/env";

async function main(): Promise<void> {
  if (env.APP_ENV === "production" || process.env.NODE_ENV === "production") {
    throw new Error("Demo seed is forbidden in production.");
  }
  if (!env.ALLOW_DEMO_SEED) {
    throw new Error(
      "Demo seed is disabled. Set ALLOW_DEMO_SEED=true explicitly.",
    );
  }
  if (!process.argv.includes(`--confirm-database=${env.DB_NAME}`)) {
    throw new Error(
      "Pass --confirm-database=<DB_NAME> to confirm the seed target.",
    );
  }
  console.log(`Demo seed target: ${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`);
  const { bootstrapWorker, TransactionalConnection } =
    await import("@vendure/core");
  const { config } = await import("../vendure-config.js");
  const { seedDemo } = await import("./seed/seed-demo-data.js");
  const worker = await bootstrapWorker(config);
  const runner = worker.app
    .get(TransactionalConnection)
    .rawConnection.createQueryRunner();
  let locked = false;
  try {
    await runner.connect();
    // PostgreSQL session lock prevents seed processes racing on natural keys.
    const rows: Array<{ locked: boolean }> = await runner.query(
      "SELECT pg_try_advisory_lock(782341, 1) AS locked",
    );
    locked = rows[0]?.locked === true;
    if (!locked)
      throw new Error("Another demo seed is already running in this database.");
    await seedDemo(worker.app);
    console.log(
      "Demo seed completed. Existing prices and stock were preserved.",
    );
    console.log(
      "Run the normal Vendure Worker to process collection/search jobs.",
    );
  } finally {
    try {
      if (locked) await runner.query("SELECT pg_advisory_unlock(782341, 1)");
    } finally {
      try {
        await runner.release();
      } finally {
        await worker.app.close();
      }
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Demo seed failed.");
  process.exitCode = 1;
});
