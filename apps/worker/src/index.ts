import { config } from "dotenv";
import { resolve } from "path";
import { runMigrations } from "graphile-worker";
import { GraphileWorkerQueue } from "@namegame/queue";
import { jobs } from "./jobs";

// Load environment variables from .env (symlink to root .env)
config({ path: resolve(__dirname, "../.env") });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

async function main() {
  console.log("[Worker] Starting worker service...");

  // Auto-initialize Graphile Worker database schema if needed
  console.log("[Worker] Ensuring Graphile Worker tables exist...");
  try {
    // Handle SSL for DigitalOcean managed database by modifying connection string
    const connectionString =
      process.env.NODE_ENV === "production"
        ? DATABASE_URL!.replace("sslmode=require", "sslmode=no-verify")
        : DATABASE_URL!;

    await runMigrations({ connectionString });
    console.log("[Worker] ✅ Graphile Worker database schema ready");
  } catch (error: any) {
    if (error.code === "42501") {
      console.warn(
        "[Worker] ⚠️ Database permissions issue - continuing without migrations"
      );
      console.warn(
        "[Worker] Note: Ensure graphile_worker schema exists and user has permissions"
      );
    } else {
      console.error("[Worker] ❌ Failed to initialize database schema:", error);
      process.exit(1);
    }
  }

  console.log("[Worker] Registered jobs:", Object.keys(jobs));

  // Use the same SSL-modified connection string for the queue
  const queueConnectionString =
    process.env.NODE_ENV === "production"
      ? DATABASE_URL!.replace("sslmode=require", "sslmode=no-verify")
      : DATABASE_URL!;

  const queue = new GraphileWorkerQueue(
    {
      connectionString: queueConnectionString,
      concurrency: 5, // Process up to 5 jobs concurrently
      pollInterval: 1000, // Check for new jobs every second
      // NOTE: Crontab disabled due to RLS permissions on DigitalOcean managed DB
      // Use manual trigger or external cron instead: apps/worker/scripts/trigger-daily-notifications.ts
      // crontab: `
      //   # Daily chat notifications at 12:30 PM Mountain Time (18:30 UTC in winter, 19:30 UTC in summer)
      //   # Using 19:30 UTC as a compromise (12:30 PM MDT)
      //   30 19 * * * send-daily-chat-notifications
      // `,
    },
    jobs
  );

  await queue.start();

  console.log("[Worker] Worker service started successfully");

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`[Worker] ${signal} received, shutting down gracefully...`);
    await queue.stop();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((error) => {
  console.error("[Worker] Failed to start worker service:", error);
  process.exit(1);
});
