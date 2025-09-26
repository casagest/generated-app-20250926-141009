import { Env } from './core-utils';
import { MessageBatch } from '@cloudflare/workers-types';
import { getAuditService } from './audit';
interface MediaMessage {
  r2Key: string;
}
export const mediaHandler = async (batch: MessageBatch<MediaMessage>, env: Env): Promise<void> => {
  for (const message of batch.messages) {
    try {
      const { r2Key } = message.body;
      console.log(`Processing media file: ${r2Key}`);
      const auditService = getAuditService(env);
      await auditService.log('MEDIA_PROCESSING_QUEUED', {
        targetId: r2Key,
        details: { message: 'Media file processing task received.' }
      });
      // Placeholder for actual media processing logic (e.g., thumbnail generation)
      message.ack();
    } catch (err) {
      console.error(`Error processing media message for ${message.body.r2Key}:`, err);
      message.retry();
    }
  }
};