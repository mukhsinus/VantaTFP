import { logger } from '../utils/logger.js';

export async function sendTelegramStub(params: {
  tenantId: string;
  userId: string;
  title: string;
  message: string;
}): Promise<void> {
  logger.info(
    {
      channel: 'telegram_stub',
      tenantId: params.tenantId,
      userId: params.userId,
      title: params.title,
      message: params.message,
    },
    'Telegram notification stub invoked'
  );
}
