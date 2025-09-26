import { Env } from './core-utils';
import { AuditLog } from '@shared/types';
class AuditService {
  private env: Env;
  constructor(env: Env) {
    this.env = env;
  }
  async log(
    action: string,
    options: {
      userId?: string;
      targetId?: string;
      details?: Record<string, any>;
    }
  ) {
    try {
      const auditLog: AuditLog = {
        id: crypto.randomUUID(),
        action,
        user_id: options.userId,
        target_id: options.targetId,
        details: options.details,
        timestamp: new Date().toISOString(),
      };
      await this.env.AUDIT_QUEUE.send(auditLog);
    } catch (error) {
      console.error(`Failed to dispatch audit log for action "${action}":`, error);
      // In a production system, you might have a fallback logging mechanism here.
    }
  }
}
export const getAuditService = (env: Env) => new AuditService(env);