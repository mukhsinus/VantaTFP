import { logger } from '../utils/logger.js';

export async function sendEmailStub(params: {
  tenantId: string;
  userId: string;
  subject: string;
  body: string;
}): Promise<void> {
  logger.info(
    {
      channel: 'email_stub',
      tenantId: params.tenantId,
      userId: params.userId,
      subject: params.subject,
      body: params.body,
    },
    'Email notification stub invoked'
  );
}
