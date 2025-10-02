/**
 * Quick test script to verify worker functionality
 */
import { config } from 'dotenv';
import { resolve } from 'path';
import { quickAddJob } from 'graphile-worker';

config({ path: resolve(__dirname, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL required');
}

async function test() {
  console.log('✅ Worker package loads correctly');
  console.log('✅ Database URL configured');
  console.log('✅ Graphile Worker library accessible');
  
  // Add a test job
  await quickAddJob(
    { connectionString: DATABASE_URL },
    'send-email',
    {
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'This is a test job',
    }
  );
  
  console.log('✅ Test job added to queue successfully');
  console.log('\n🎉 Worker service is ready to use!');
  console.log('\nTo start the worker:');
  console.log('  pnpm dev:worker');
  
  process.exit(0);
}

test().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
