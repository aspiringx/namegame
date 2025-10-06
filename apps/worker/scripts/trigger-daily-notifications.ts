#!/usr/bin/env tsx
/**
 * Manual trigger script for testing daily chat notifications
 * 
 * Usage:
 *   pnpm --filter worker tsx scripts/trigger-daily-notifications.ts
 */

import { quickAddJob } from 'graphile-worker';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../../../.env') });

async function triggerNotification() {
  try {
    console.log('[Trigger] Manually triggering daily chat notifications job...');
    
    // Handle SSL for DigitalOcean managed database
    const connectionString = process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL!.replace('sslmode=require', 'sslmode=no-verify')
      : process.env.DATABASE_URL!;
    
    await quickAddJob(
      { connectionString },
      'send-daily-chat-notifications',
      {}
    );
    
    console.log('[Trigger] Job queued successfully!');
    console.log('[Trigger] Check worker logs to see the job execution.');
    
    process.exit(0);
  } catch (error) {
    console.error('[Trigger] Error:', error);
    process.exit(1);
  }
}

triggerNotification().catch((error) => {
  console.error('[Trigger] Error:', error);
  process.exit(1);
});
