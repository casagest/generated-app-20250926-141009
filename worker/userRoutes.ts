import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { AIService } from "./ai";
import { Lead } from "./types";
// Shared function for creating a new lead.
// This centralizes the logic for both manual and AI-driven lead creation.
export async function createNewLead(
  leadData: { name: string; email: string; phone?: string; source: Lead["source"]; },
  env: Env
): Promise<Lead> {
  const { name, email, phone, source } = leadData;
  if (!name || !email || !source) {
    throw new Error('Missing required fields');
  }
  // AI Lead Scoring Integration
  const aiService = new AIService(env);
  const aiScore = await aiService.scoreLead({ name, email, phone: phone || "", source });
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const newLead: Lead = {
    id, name, email, phone: phone || "", source: source as Lead["source"],
    status: 'New', aiScore,
    assignedTo: 'Unassigned', lastContacted: createdAt, createdAt,
    avatarUrl: `https://i.pravatar.cc/40?u=${id}`,
  };
  await env.DB.prepare(
    "INSERT INTO leads (id, name, email, phone, status, ai_score, source, assigned_to, last_contacted_at, created_at, avatar_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).bind(
    newLead.id, newLead.name, newLead.email, newLead.phone, newLead.status, newLead.aiScore,
    newLead.source, newLead.assignedTo, newLead.lastContacted, newLead.createdAt, newLead.avatarUrl
  ).run();
  return newLead;
}
/**
 * DO NOT MODIFY THIS FUNCTION. Only for your reference.
 */
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    // Use this API for conversations. **DO NOT MODIFY**
    app.all('/api/chat/:sessionId/*', async (c) => {
        try {
        const sessionId = c.req.param('sessionId');
        const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId); // Get existing agent or create a new one if it doesn't exist, with sessionId as the name
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
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // --- CRM API Routes ---
    app.get('/api/dashboard-stats', async (c) => {
        const db = c.env.DB;
        const now = new Date();
        const monthStart = format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const lastMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const lastMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
        const newLeadsThisMonth = await db.prepare("SELECT COUNT(*) as count FROM leads WHERE created_at >= ?").bind(monthStart).first<{ count: number }>();
        const newLeadsLastMonth = await db.prepare("SELECT COUNT(*) as count FROM leads WHERE created_at >= ? AND created_at <= ?").bind(lastMonthStart, lastMonthEnd).first<{ count: number }>();
        const newLeadsCount = newLeadsThisMonth?.count ?? 0;
        const lastMonthLeadsCount = newLeadsLastMonth?.count ?? 1; // Avoid division by zero
        const leadChange = (((newLeadsCount - lastMonthLeadsCount) / lastMonthLeadsCount) * 100).toFixed(1);
        const kpiData = [
            { title: "New Leads (Month)", value: newLeadsCount.toString(), change: `${leadChange}%`, changeType: parseFloat(leadChange) >= 0 ? "increase" : "decrease" },
            // Other KPIs would be calculated here...
        ];
        const recentLeads = await db.prepare("SELECT * FROM leads ORDER BY created_at DESC LIMIT 7").all();
        const data = {
            kpiData: kpiData,
            leadTrendData: [], // Complex query, omitted for now
            upcomingAppointments: [], // Complex query, omitted for now
            recentLeads: recentLeads.results.map((l: any) => ({ ...l, aiScore: l.ai_score, assignedTo: l.assigned_to, avatarUrl: l.avatar_url, createdAt: l.created_at, lastContacted: l.last_contacted_at })),
        };
        return c.json({ success: true, data });
    });
    app.get('/api/leads', async (c) => {
        const { results } = await c.env.DB.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
        const leads = results.map((l: any) => ({ ...l, aiScore: l.ai_score, assignedTo: l.assigned_to, avatarUrl: l.avatar_url, createdAt: l.created_at, lastContacted: l.last_contacted_at }));
        return c.json({ success: true, data: leads });
    });
    app.post('/api/leads', async (c) => {
        try {
            const body = await c.req.json();
            const newLead = await createNewLead(body, c.env);
            return c.json({ success: true, data: newLead }, 201);
        } catch (error) {
            return c.json({ success: false, error: (error as Error).message }, 400);
        }
    });
    app.get('/api/patients/:id', async (c) => {
        const { id } = c.req.param();
        const leadData: any = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
        if (!leadData) {
            return c.json({ success: false, error: 'Patient not found' }, 404);
        }
        const patientData: any = await c.env.DB.prepare("SELECT * FROM patients WHERE id = ?").bind(id).first();
        const patient = {
            ...leadData,
            aiScore: leadData.ai_score, assignedTo: leadData.assigned_to, avatarUrl: leadData.avatar_url, createdAt: leadData.created_at, lastContacted: leadData.last_contacted_at,
            patientId: `P${String(patientData?.patient_id_serial || '').padStart(3, '0')}`,
            dateOfBirth: patientData?.date_of_birth, address: patientData?.address, treatmentPlan: patientData?.treatment_plan,
            totalBilled: patientData?.total_billed || 0, totalPaid: patientData?.total_paid || 0,
        };
        return c.json({ success: true, data: patient });
    });
    app.put('/api/patients/:id/status', async (c) => {
        const { id } = c.req.param();
        const { status } = await c.req.json();
        const allowedStatuses = ['New', 'Contacted', 'Qualified', 'Consultation Scheduled', 'Treatment Plan', 'Treatment', 'Closed'];
        if (!allowedStatuses.includes(status)) {
            return c.json({ success: false, error: 'Invalid status value' }, 400);
        }
        const { success } = await c.env.DB.prepare("UPDATE leads SET status = ? WHERE id = ?").bind(status, id).run();
        if (!success) {
            return c.json({ success: false, error: 'Failed to update status' }, 500);
        }
        const updatedPatient = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(id).first();
        return c.json({ success: true, data: updatedPatient });
    });
    app.get('/api/patients/:id/appointments', async (c) => {
        const { id } = c.req.param();
        const { results } = await c.env.DB.prepare("SELECT a.*, l.name as patientName FROM appointments a JOIN leads l ON a.patient_id = l.id WHERE a.patient_id = ?").bind(id).all();
        return c.json({ success: true, data: results });
    });
    app.get('/api/patients/:id/communications', async (c) => {
        const { id } = c.req.param();
        const { results } = await c.env.DB.prepare("SELECT * FROM communications WHERE patient_id = ?").bind(id).all();
        return c.json({ success: true, data: results });
    });
    app.get('/api/patients/:id/documents', async (c) => {
        const { id } = c.req.param();
        const { results } = await c.env.DB.prepare("SELECT * FROM documents WHERE patient_id = ?").bind(id).all();
        return c.json({ success: true, data: results });
    });
    app.get('/api/reports/full', async (c) => {
        // This remains mocked as it requires complex aggregations not yet built.
        const data = {
            financialSummary: { totalRevenue: 125430, totalExpenses: 75210, netProfit: 50220, monthlyPnl: [ { month: "Jan", revenue: 20000, expenses: 12000, profit: 8000 }, { month: "Feb", revenue: 22000, expenses: 13000, profit: 9000 }, { month: "Mar", revenue: 25000, expenses: 15000, profit: 10000 }, { month: "Apr", revenue: 28000, expenses: 16000, profit: 12000 }, { month: "May", revenue: 30430, expenses: 19210, profit: 11220 }, ] },
            marketingMetrics: { cac: 150.75, roas: 4.2, leadsBySource: [ { source: "Website", count: 120 }, { source: "Referral", count: 85 }, { source: "Social Media", count: 60 }, { source: "Advertisement", count: 45 }, ] },
            conversionFunnel: [ { name: "New", value: 310 }, { name: "Qualified", value: 150 }, { name: "Consultation", value: 100 }, { name: "Treatment", value: 60 }, ],
        };
        return c.json({ success: true, data });
    });
    app.get('/api/appointments', async (c) => {
        const { results } = await c.env.DB.prepare("SELECT a.*, l.name as patientName FROM appointments a JOIN leads l ON a.patient_id = l.id ORDER BY a.start_time").all();
        return c.json({ success: true, data: results });
    });
    app.get('/api/agencies', async (c) => {
        const agenciesResult = await c.env.DB.prepare("SELECT * FROM agencies").all();
        const performanceResult = await c.env.DB.prepare("SELECT * FROM agency_monthly_performance").all();
        const agencies = agenciesResult.results.map((agency: any) => {
            const monthlyPerformance = performanceResult.results
                .filter((p: any) => p.agency_id === agency.id)
                .map((p: any) => ({ month: p.month, leads: p.leads }));
            return { ...agency, monthlyPerformance, costPerLead: agency.cost_per_lead, primarySource: agency.primary_source, totalCommission: agency.total_commission, totalLeads: agency.total_leads, conversionRate: agency.conversion_rate };
        });
        return c.json({ success: true, data: agencies });
    });
    app.get('/api/users-roles', async (c) => {
        const usersQuery = c.env.DB.prepare("SELECT u.id, u.name, u.email, r.name as role, u.status FROM users u JOIN roles r ON u.role_id = r.id");
        const rolesQuery = c.env.DB.prepare("SELECT * FROM roles");
        const [usersResult, rolesResult] = await Promise.all([usersQuery.all(), rolesQuery.all()]);
        const roles = rolesResult.results.map((r: any) => {
            let permissions = [];
            try {
                permissions = JSON.parse(r.permissions);
            } catch (e) {
                console.error(`Failed to parse permissions for role ${r.id}:`, e);
            }
            return { ...r, permissions };
        });
        return c.json({ success: true, data: { users: usersResult.results, roles } });
    });
    // --- Session Management Routes ---
    app.get('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleString([], { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    const truncated = cleanMessage.length > 40 ? cleanMessage.slice(0, 37) + '...' : cleanMessage;
                    sessionTitle = `${truncated} • ${dateTime}`;
                } else {
                    sessionTitle = `Chat ${dateTime}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({ success: true, data: { sessionId, title: sessionTitle } });
        } catch (error) {
            console.error('Failed to create session:', error);
            return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            if (!deleted) {
                return c.json({ success: false, error: 'Session not found' }, { status: 404 });
            }
            return c.json({ success: true, data: { deleted: true } });
        } catch (error) {
            console.error('Failed to delete session:', error);
            return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
        }
    });
    app.put('/api/sessions/:sessionId/title', async (c) => {
        try {
            const sessionId = c.req.param('sessionId');
            const { title } = await c.req.json();
            if (!title || typeof title !== 'string') {
                return c.json({ success: false, error: 'Title is required' }, { status: 400 });
            }
            const controller = getAppController(c.env);
            const updated = await controller.updateSessionTitle(sessionId, title);
            if (!updated) {
                return c.json({ success: false, error: 'Session not found' }, { status: 404 });
            }
            return c.json({ success: true, data: { title } });
        } catch (error) {
            console.error('Failed to update session title:', error);
            return c.json({ success: false, error: 'Failed to update session title' }, { status: 500 });
        }
    });
    app.delete('/api/sessions', async (c) => {
        try {
            const controller = getAppController(c.env);
            const deletedCount = await controller.clearAllSessions();
            return c.json({ success: true, data: { deletedCount } });
        } catch (error) {
            console.error('Failed to clear all sessions:', error);
            return c.json({ success: false, error: 'Failed to clear all sessions' }, { status: 500 });
        }
    });
}