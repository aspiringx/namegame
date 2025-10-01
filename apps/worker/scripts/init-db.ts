/**
 * Initialize Graphile Worker database schema
 * 
 * Run this once to create the necessary tables in your database
 */
import { runMigrations } from 'graphile-worker';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is required');
  process.exit(1);
}

async function initDatabase() {
  console.log('[Init] Initializing Graphile Worker database schema...');
  
  try {
    await runMigrations({
      connectionString: DATABASE_URL,
    });
    
    console.log('[Init] ✅ Database schema initialized successfully');
    console.log('[Init] Graphile Worker tables created:');
    console.log('[Init]   - graphile_worker.jobs');
    console.log('[Init]   - graphile_worker.job_queues');
    console.log('[Init]   - graphile_worker.known_crontabs');
    console.log('[Init]   - graphile_worker.migrations');
    
    process.exit(0);
  } catch (error) {
    console.error('[Init] ❌ Failed to initialize database schema:', error);
    process.exit(1);
  }
}

initDatabase();
