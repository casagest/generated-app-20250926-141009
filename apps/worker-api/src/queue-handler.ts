import { Env } from './core-utils';
import { Lead } from '@shared/types';
import { MessageBatch } from '@cloudflare/workers-types';
interface QueueMessage {
  lead: Lead;
}
export const queueHandler = async (batch: MessageBatch<QueueMessage>, env: Env, ctx: ExecutionContext): Promise<void> => {
  for (const message of batch.messages) {
    try {
      const { lead } = message.body;
      // Deduplication check: See if a lead with this email (excluding the current one) already exists.
      const existingLead = await env.MEDICALCOR_DB.prepare(
        "SELECT id FROM leads WHERE email = ? AND id != ? LIMIT 1"
      ).bind(lead.email, lead.id).first();
      if (existingLead) {
        console.log(`Duplicate lead detected and ignored: ${lead.email}`);
        const activityId = crypto.randomUUID();
        const description = `Duplicate lead ignored for email: ${lead.email}`;
        const details = JSON.stringify({ newLeadId: lead.id, existingLeadId: existingLead.id });
        await env.MEDICALCOR_DB.prepare(
          "INSERT INTO activities (id, type, description, details) VALUES (?, ?, ?, ?)"
        ).bind(activityId, 'DUPLICATE_LEAD_IGNORED', description, details).run();
        message.ack();
        continue; // Skip processing
      }
      console.log(`Processing lead for call center: ${lead.name} (${lead.id})`);
      const activityId = crypto.randomUUID();
      const description = `New lead '${lead.name}' sent to call center for immediate follow-up.`;
      const details = JSON.stringify({ leadId: lead.id, aiScore: lead.aiScore });
      await env.MEDICALCOR_DB.prepare(
        "INSERT INTO activities (id, type, description, details) VALUES (?, ?, ?, ?)"
      ).bind(activityId, 'CALL_CENTER_NOTIFIED', description, details).run();
      message.ack();
    } catch (err) {
      console.error('Error processing queue message:', err);
      message.retry();
    }
  }
};