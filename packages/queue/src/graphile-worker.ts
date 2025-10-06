import { run, quickAddJob, Runner, RunnerOptions } from 'graphile-worker';
import type { JobQueue, JobRegistry, JobOptions } from './types';

export interface GraphileWorkerConfig {
  connectionString: string;
  concurrency?: number;
  pollInterval?: number;
  crontab?: string;
}

/**
 * Graphile Worker implementation of JobQueue
 * 
 * Uses Postgres for job storage and processing.
 * Good for: 100s of jobs/minute, acceptable latency 100ms-1s
 * Cost: $0 (uses existing Postgres database)
 */
export class GraphileWorkerQueue implements JobQueue {
  private runner: Runner | null = null;
  private config: GraphileWorkerConfig;
  private jobs: JobRegistry;

  constructor(config: GraphileWorkerConfig, jobs: JobRegistry) {
    this.config = config;
    this.jobs = jobs;
  }

  async addJob<T>(
    jobName: string,
    payload: T,
    options?: JobOptions
  ): Promise<void> {
    const jobOptions: any = {};

    if (options?.priority !== undefined) {
      jobOptions.priority = options.priority;
    }

    if (options?.runAt) {
      jobOptions.runAt = options.runAt;
    }

    if (options?.maxAttempts !== undefined) {
      jobOptions.maxAttempts = options.maxAttempts;
    }

    if (options?.jobKey) {
      jobOptions.jobKey = options.jobKey;
    }

    await quickAddJob(
      { connectionString: this.config.connectionString },
      jobName,
      payload,
      jobOptions
    );
  }

  async start(): Promise<void> {
    if (this.runner) {
      throw new Error('Queue is already running');
    }

    const runnerOptions: RunnerOptions = {
      connectionString: this.config.connectionString,
      taskList: this.jobs,
      concurrency: this.config.concurrency || 5,
      pollInterval: this.config.pollInterval || 1000,
      crontab: this.config.crontab,
    };

    this.runner = await run(runnerOptions);

    console.log('[Queue] Graphile Worker started', {
      concurrency: runnerOptions.concurrency,
      pollInterval: runnerOptions.pollInterval,
      jobs: Object.keys(this.jobs),
    });
  }

  async stop(): Promise<void> {
    if (!this.runner) {
      return;
    }

    console.log('[Queue] Stopping Graphile Worker...');
    await this.runner.stop();
    this.runner = null;
    console.log('[Queue] Graphile Worker stopped');
  }
}
