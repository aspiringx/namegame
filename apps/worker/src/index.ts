import { GraphileWorkerQueue } from '@namegame/queue';
import { jobs } from './jobs';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

async function main() {
  console.log('[Worker] Starting worker service...');
  console.log('[Worker] Registered jobs:', Object.keys(jobs));

  const queue = new GraphileWorkerQueue(
    {
      connectionString: DATABASE_URL,
      concurrency: 5, // Process up to 5 jobs concurrently
      pollInterval: 1000, // Check for new jobs every second
    },
    jobs
  );

  await queue.start();

  console.log('[Worker] Worker service started successfully');

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`[Worker] ${signal} received, shutting down gracefully...`);
    await queue.stop();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((error) => {
  console.error('[Worker] Failed to start worker service:', error);
  process.exit(1);
});
