import { Env } from './core-utils';
import { LeadIntakePayload } from '@shared/types';
import { MessageBatch } from '@cloudflare/workers-types';
import { createNewLead } from './userRoutes';
export const leadIntakeHandler = async (batch: MessageBatch<LeadIntakePayload>, env: Env): Promise<void> => {
  for (const message of batch.messages) {
    try {
      const leadData = message.body;
      console.log(`Processing lead intake for: ${leadData.email}`);
      // Use the existing createNewLead function to ensure consistent processing
      // (including AI scoring, D1 insertion, and sending to the call center queue)
      await createNewLead({
        name: leadData.name,
        email: leadData.email,
        phone: leadData.phone,
        source: 'Chatbot',
      }, env);
      console.log(`Successfully created lead from intake queue for ${leadData.email}`);
      // Here you would trigger a Cloudflare Workflow if it were available/configured.
      // For now, we simulate this by logging.
      console.log(`Simulating LeadIntakeWorkflow trigger for lead: ${leadData.email}`);
      message.ack();
    } catch (err) {
      console.error('Error processing lead intake message:', err);
      message.retry();
    }
  }
};