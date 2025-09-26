import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from "./config";
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { AIService } from "./ai";
import { Lead, Transaction, EscrowRule, UtmEvent, AgencyContract, Dispute, DailyKpi, Settlement, ImportJob } from "@shared/types";
import { getAuditService } from "./audit";
import { DisputeDO } from "./dispute-do";
type CreateLeadInput = {
  name: string;
  email: string;
  phone?: string;
  source: Lead["source"];
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};
export async function createNewLead(
  leadData: CreateLeadInput,
  env: Env
): Promise<Lead> {
  const { name, email, phone, source, ...utmParams } = leadData;
  if (!name || !email || !source) {
    throw new Error('Missing required fields');
  }
  const aiService = new AIService(env);
  const { score, explanation, next_action } = await aiService.scoreLead({ name, email, phone: phone || "", source });
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newLead: Lead = {
    id, name, email, phone: phone || "", source: source as Lead["source"],
    status: 'New',
    aiScore: score,
    ai_explanation: explanation,
    ai_next_action: next_action,
    assignedTo: 'Unassigned', lastContacted: createdAt, createdAt,
    avatarUrl: `https://i.pravatar.cc/40?u=${id}`,
    ...utmParams,
  };
  await env.MEDICALCOR_DB.prepare(
    `INSERT INTO leads (id, name, email, phone, status, ai_score, ai_explanation, ai_next_action, source, assigned_to, last_contacted_at, created_at, avatar_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    newLead.id, newLead.name, newLead.email, newLead.phone, newLead.status, newLead.aiScore,
    newLead.ai_explanation, newLead.ai_next_action, newLead.source, newLead.assignedTo,
    newLead.lastContacted, newLead.createdAt, newLead.avatarUrl,
    newLead.utm_source || null, newLead.utm_medium || null, newLead.utm_campaign || null,
    newLead.utm_term || null, newLead.utm_content || null
  ).run();
  await env.LEAD_QUEUE.send({ lead: newLead });
  return newLead;
}
export function coreRoutes(app: Hono<{Bindings: Env;}>) {
  app.all('/api/chat/:sessionId/*', async (c) => {
    try {
      const sessionId = c.req.param('sessionId');
      const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT as any, sessionId);
      const url = new URL(c.req.url);
      url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
      return agent.fetch(new Request(url.toString(), {
        method: c.req.method,
        headers: c.req.header(),
        body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
      }));
    } catch (error) {
      console.error('Agent routing error:', error);
      return c.json({
        success: false,
        error: API_RESPONSES.AGENT_ROUTING_FAILED
      }, { status: 500 });
    }
  });
}
export function userRoutes(app: Hono<{Bindings: Env;}>) {
  // --- Data Import ---
  app.post('/api/import/leads', async (c) => {
    const { r2Key, fileName, createdBy } = await c.req.json();
    const jobId = crypto.randomUUID();
    await c.env.MEDICALCOR_DB.prepare(
      `INSERT INTO import_jobs (id, file_name, r2_key, created_by) VALUES (?, ?, ?, ?)`
    ).bind(jobId, fileName, r2Key, createdBy).run();
    await c.env.IMPORT_QUEUE.send({ jobId, r2Key });
    return c.json({ success: true, data: { jobId } }, 202);
  });
  app.get('/api/import/history', async (c) => {
    const { results } = await c.env.MEDICALCOR_DB.prepare(
      "SELECT * FROM import_jobs ORDER BY created_at DESC"
    ).all<ImportJob>();
    return c.json({ success: true, data: results });
  });
  // --- Settlements ---
  app.get('/api/settlements', async (c) => {
    const { results } = await c.env.MEDICALCOR_DB.prepare(
      `SELECT s.*, ac.name as contract_name, a.name as agency_name
       FROM settlements s
       JOIN agency_contracts ac ON s.contract_id = ac.id
       JOIN agencies a ON ac.agency_id = a.id
       ORDER BY s.period_end DESC`
    ).all<Settlement & { contract_name: string; agency_name: string }>();
    return c.json({ success: true, data: results });
  });
  // --- KPI Reporting ---
  app.get('/api/reports/kpi', async (c) => {
    const { startDate, endDate } = c.req.query();
    let query = "SELECT * FROM kpi_daily";
    const params = [];
    if (startDate && endDate) {
        query += " WHERE date >= ? AND date <= ?";
        params.push(startDate, endDate);
    }
    query += " ORDER BY date DESC";
    const { results } = await c.env.MEDICALCOR_DB.prepare(query).bind(...params).all<DailyKpi>();
    return c.json({ success: true, data: results });
  });
  app.post('/api/reports/kpi/export', async (c) => {
    const { startDate, endDate } = await c.req.json();
    let query = "SELECT * FROM kpi_daily";
    const params = [];
    if (startDate && endDate) {
        query += " WHERE date >= ? AND date <= ?";
        params.push(startDate, endDate);
    }
    query += " ORDER BY date ASC";
    const { results } = await c.env.MEDICALCOR_DB.prepare(query).bind(...params).all<DailyKpi>();
    const headers = "Date,New Leads,Consultations,Treatments Started,Conversion Rate (%),Total Revenue\n";
    const csvRows = results.map(row =>
        `${row.date},${row.new_leads},${row.consultations_scheduled},${row.treatments_started},${row.conversion_rate.toFixed(2)},${row.total_revenue.toFixed(2)}`
    );
    const csvContent = headers + csvRows.join('\n');
    const filename = `kpi-report-${startDate}-to-${endDate}.csv`;
    const objectKey = `reports/${crypto.randomUUID()}-${filename}`;
    await c.env.MEDICALCOR_FILES.put(objectKey, csvContent, {
        httpMetadata: { contentType: 'text/csv' },
    });
    const signedUrl = await c.env.MEDICALCOR_FILES.getSignedUrl(objectKey, { action: 'download', expires: 300 });
    return c.json({ success: true, data: { url: signedUrl } });
  });
  // --- Dispute Management ---
  app.post('/api/patients/:id/disputes', async (c) => {
    const patient_id = c.req.param('id');
    const { subject, description, created_by } = await c.req.json();
    const disputeId = c.env.DISPUTE_DO.newUniqueId();
    const stub = c.env.DISPUTE_DO.get(disputeId);
    const newDispute = await stub.create({ patient_id, subject, description, created_by });
    return c.json({ success: true, data: newDispute }, 201);
  });
  app.put('/api/disputes/:disputeId/status', async (c) => {
    const { disputeId } = c.req.param();
    const { status, resolution_details, user } = await c.req.json();
    const id = c.env.DISPUTE_DO.idFromString(disputeId);
    const stub = c.env.DISPUTE_DO.get(id);
    const updatedDispute = await stub.updateStatus(status, { resolution_details, user });
    return c.json({ success: true, data: updatedDispute });
  });
  app.get('/api/patients/:id/disputes', async (c) => {
    const { id } = c.req.param();
    const { results } = await c.env.MEDICALCOR_DB.prepare("SELECT * FROM disputes WHERE patient_id = ? ORDER BY created_at DESC").bind(id).all<Dispute>();
    return c.json({ success: true, data: results });
  });
}