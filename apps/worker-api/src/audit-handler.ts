import { Env } from './core-utils';
import { AuditLog } from '@shared/types';
import { MessageBatch } from '@cloudflare/workers-types';
export const auditHandler = async (batch: MessageBatch<AuditLog>, env: Env): Promise<void> => {
  const promises: Promise<any>[] = [];
  for (const message of batch.messages) {
    try {
      const log = message.body;
      console.log(`Processing audit log: ${log.action} for target ${log.target_id}`);
      const promise = env.MEDICALCOR_DB.prepare(
        "INSERT INTO audit_logs (id, action, user_id, target_id, details, timestamp) VALUES (?, ?, ?, ?, ?, ?)"
      ).bind(
        log.id,
        log.action,
        log.user_id,
        log.target_id,
        log.details ? JSON.stringify(log.details) : null,
        log.timestamp
      ).run();
      promises.push(promise);
      message.ack();
    } catch (err) {
      console.error('Error processing audit log message:', err);
      message.retry();
    }
  }
  await Promise.all(promises);
};