#!/usr/bin/env tsx
/**
 * Manual trigger script for testing daily chat notifications
 * 
 * Usage:
 *   pnpm --filter worker tsx scripts/trigger-daily-notifications.ts
 */

import { run } from 'graphile-worker';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../.env') });

async function triggerNotification() {
  const runner = await run({
    connectionString: process.env.DATABASE_URL!,
    concurrency: 1,
    noHandleSignals: false,
    pollInterval: 1000,
  });

  try {
    console.log('[Trigger] Manually triggering daily chat notifications job...');
    
    await runner.addJob('send-daily-chat-notifications', {});
    
    console.log('[Trigger] Job queued successfully!');
    console.log('[Trigger] Check worker logs to see the job execution.');
    
    // Wait a moment for the job to be picked up
    await new Promise(resolve => setTimeout(resolve, 2000));
  } finally {
    await runner.stop();
    process.exit(0);
  }
}

triggerNotification().catch((error) => {
  console.error('[Trigger] Error:', error);
  process.exit(1);
});
