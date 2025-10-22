/**
 * Queue abstraction package
 * 
 * Provides a unified interface for job queues that can be backed by
 * different implementations (Postgres via Graphile Worker, Redis via BullMQ, etc.)
 */

export * from './types.js';
export { GraphileWorkerQueue } from './graphile-worker.js';

// Re-export quickAddJob for lightweight job queuing from web app
export { quickAddJob } from 'graphile-worker';

// Future: export { BullMQQueue } from './bullmq';
