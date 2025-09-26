import { Env } from './core-utils';
import { MessageBatch } from '@cloudflare/workers-types';
import { createNewLead } from './userRoutes';
import { LeadSource } from '@shared/types';
interface ImportMessage {
  jobId: string;
  r2Key: string;
}
// A very simple CSV parser
function parseCSV(csv: string): Record<string, string>[] {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index];
            return obj;
        }, {} as Record<string, string>);
    });
}
export const importHandler = async (batch: MessageBatch<ImportMessage>, env: Env): Promise<void> => {
  for (const message of batch.messages) {
    const { jobId, r2Key } = message.body;
    try {
      await env.MEDICALCOR_DB.prepare("UPDATE import_jobs SET status = 'Processing' WHERE id = ?").bind(jobId).run();
      const object = await env.MEDICALCOR_FILES.get(r2Key);
      if (!object) {
        throw new Error(`File not found in R2: ${r2Key}`);
      }
      const csvText = await object.text();
      const rows = parseCSV(csvText);
      let processed_rows = 0;
      let failed_rows = 0;
      const error_log: string[] = [];
      await env.MEDICALCOR_DB.prepare("UPDATE import_jobs SET total_rows = ? WHERE id = ?").bind(rows.length, jobId).run();
      for (const row of rows) {
        try {
          // Basic validation
          if (!row.name || !row.email || !row.source) {
            throw new Error(`Missing required fields: name, email, source.`);
          }
          await createNewLead({
            name: row.name,
            email: row.email,
            phone: row.phone,
            source: row.source as LeadSource,
          }, env);
          processed_rows++;
        } catch (e: any) {
          failed_rows++;
          error_log.push(`Row ${processed_rows + failed_rows}: ${e.message}`);
        }
      }
      await env.MEDICALCOR_DB.prepare(
        `UPDATE import_jobs SET status = 'Completed', processed_rows = ?, failed_rows = ?, error_log = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(processed_rows, failed_rows, error_log.join('\n'), jobId).run();
      message.ack();
    } catch (err: any) {
      console.error(`Failed to process import job ${jobId}:`, err);
      await env.MEDICALCOR_DB.prepare(
        `UPDATE import_jobs SET status = 'Failed', error_log = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).bind(err.message, jobId).run();
      message.ack(); // Acknowledge to prevent retries for now
    }
  }
};