import { JobRegistry } from '@namegame/queue';
import { sendEmail } from './send-email';
import { processImage } from './process-image';

/**
 * Registry of all job handlers
 * 
 * Add new job handlers here to make them available to the worker
 */
export const jobs: JobRegistry = {
  'send-email': sendEmail,
  'process-image': processImage,
  // Add more jobs here as needed
};
