import { quickAddJob } from '@namegame/queue';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Handle SSL for DigitalOcean managed database
const connectionString =
  process.env.NODE_ENV === 'production'
    ? DATABASE_URL.replace('sslmode=require', 'sslmode=no-verify')
    : DATABASE_URL;

/**
 * Add a job to the Graphile Worker queue
 * 
 * This is a lightweight helper for adding jobs from the web app.
 * The worker service processes these jobs asynchronously.
 */
export async function addJob<T>(
  jobName: string,
  payload: T,
  options?: {
    priority?: number;
    runAt?: Date;
    maxAttempts?: number;
    jobKey?: string;
  }
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
    { connectionString },
    jobName,
    payload,
    jobOptions
  );
}

/**
 * Queue a verification email to be sent asynchronously
 */
export async function queueVerificationEmail(
  email: string,
  userId: string,
  firstName?: string | null
): Promise<void> {
  await addJob('send-verification-email', {
    email,
    userId,
    firstName: firstName ?? undefined,
  });
}
