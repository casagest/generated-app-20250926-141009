import { Hono } from "hono";
import { Env } from "./core-utils";
import { AgencyKpi, SettlementDetails } from "@shared/types";
const agency = new Hono<{ Bindings: Env; Variables: { agencyId: string } }>();
// Middleware to simulate agency authentication and data isolation (ABAC)
// In a real app, this would use JWTs and a proper auth system.
const agencyAuth = async (c: any, next: any) => {
  const agencyId = c.req.header('X-Agency-ID');
  if (!agencyId) {
    return c.json({ success: false, error: 'Unauthorized: Missing X-Agency-ID header' }, 401);
  }
  const agencyExists = await c.env.MEDICALCOR_DB.prepare("SELECT id FROM agencies WHERE id = ?").bind(agencyId).first();
  if (!agencyExists) {
    return c.json({ success: false, error: 'Forbidden: Invalid Agency ID' }, 403);
  }
  c.set('agencyId', agencyId);
  await next();
};
agency.use('/api/agency/*', agencyAuth);
agency.get('/api/agency/kpis', async (c) => {
    const agencyId = c.get('agencyId');
    // In a real app, these would be complex, time-windowed queries.
    // For now, we use the aggregated data on the agencies table.
    const agencyData = await c.env.MEDICALCOR_DB.prepare("SELECT * FROM agencies WHERE id = ?").bind(agencyId).first<any>();
    const kpis: AgencyKpi[] = [
        { title: "Total Leads Generated", value: agencyData.total_leads.toString(), change: "+5.2%", changeType: "increase", description: "All-time leads from your campaigns." },
        { title: "Conversion Rate", value: `${agencyData.conversion_rate.toFixed(1)}%`, change: "-1.5%", changeType: "decrease", description: "From new lead to treatment started." },
        { title: "Cost Per Lead (CPL)", value: `${agencyData.cost_per_lead.toFixed(2)}`, change: "+3.0%", changeType: "decrease", description: "Average cost to acquire a single lead." },
        { title: "Total Commission Earned", value: `${agencyData.total_commission.toLocaleString()}`, change: "+10.1%", changeType: "increase", description: "Total commission paid out." },
    ];
    return c.json({ success: true, data: kpis });
});
agency.get('/api/agency/settlements', async (c) => {
    const agencyId = c.get('agencyId');
    const { results } = await c.env.MEDICALCOR_DB.prepare(
      `SELECT s.*, ac.name as contract_name, acv.version_number
       FROM settlements s
       JOIN agency_contracts ac ON s.contract_id = ac.id
       JOIN agency_contract_versions acv ON s.version_id = acv.id
       WHERE ac.agency_id = ?
       ORDER BY s.period_end DESC`
    ).bind(agencyId).all<SettlementDetails>();
    return c.json({ success: true, data: results });
});
agency.get('/api/agency/contract-logic', async (c) => {
    const agencyId = c.get('agencyId');
    const result = await c.env.MEDICALCOR_DB.prepare(
        `SELECT acv.settlement_logic FROM agency_contract_versions acv
         JOIN agency_contracts ac ON acv.contract_id = ac.id
         WHERE ac.agency_id = ? AND acv.status = 'Active'
         LIMIT 1`
    ).bind(agencyId).first<{ settlement_logic: string }>();
    if (!result) {
        return c.json({ success: false, error: "No active contract found." }, 404);
    }
    return c.json({ success: true, data: { logic: JSON.parse(result.settlement_logic) } });
});
export const agencyRoutes = agency;