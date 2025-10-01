import { JobHandler } from '@namegame/queue';

interface SendEmailPayload {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

/**
 * Send email job handler
 * 
 * TODO: Integrate with actual email service (Resend, etc.)
 */
export const sendEmail: JobHandler<SendEmailPayload> = async (payload) => {
  console.log('[Job:send-email] Processing email job', {
    to: payload.to,
    subject: payload.subject,
  });

  // TODO: Implement actual email sending
  // Example:
  // await resend.emails.send({
  //   from: payload.from || 'noreply@namegame.app',
  //   to: payload.to,
  //   subject: payload.subject,
  //   html: payload.body,
  // });

  // Simulate email sending
  await new Promise((resolve) => setTimeout(resolve, 100));

  console.log('[Job:send-email] Email sent successfully', {
    to: payload.to,
  });
};
