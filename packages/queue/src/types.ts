/**
 * Queue abstraction types
 * 
 * This abstraction allows us to start with Graphile Worker (Postgres-based)
 * and easily migrate to BullMQ (Redis-based) later when performance demands it.
 */

export interface JobQueue {
  /**
   * Add a job to the queue
   */
  addJob<T = any>(jobName: string, payload: T, options?: JobOptions): Promise<void>;
  
  /**
   * Start processing jobs
   */
  start(): Promise<void>;
  
  /**
   * Stop processing jobs gracefully
   */
  stop(): Promise<void>;
}

export interface JobOptions {
  /**
   * Priority (higher number = higher priority)
   */
  priority?: number;
  
  /**
   * Schedule job to run at specific time
   */
  runAt?: Date;
  
  /**
   * Maximum number of retry attempts
   */
  maxAttempts?: number;
  
  /**
   * Job identifier (for deduplication)
   */
  jobKey?: string;
}

/**
 * Job handler function
 */
export type JobHandler<T = any> = (payload: T) => Promise<void>;

/**
 * Registry of job handlers
 */
export interface JobRegistry {
  [jobName: string]: JobHandler;
}
