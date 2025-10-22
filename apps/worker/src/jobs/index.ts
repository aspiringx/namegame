import { JobRegistry } from '@namegame/queue';
import { sendEmail } from './send-email';
import { processImage } from './process-image';
import { sendDailyChatNotifications } from './send-daily-chat-notifications';
import { sendDailyChatEmails } from './send-daily-chat-emails';
import { sendVerificationEmail } from './send-verification-email';

/**
 * Registry of all job handlers
 * 
 * Add new job handlers here to make them available to the worker
 */
export const jobs: JobRegistry = {
  'send-email': sendEmail,
  'process-image': processImage,
  'send-daily-chat-notifications': sendDailyChatNotifications,
  'send-daily-chat-emails': sendDailyChatEmails,
  'send-verification-email': sendVerificationEmail,
  // Add more jobs here as needed
};
