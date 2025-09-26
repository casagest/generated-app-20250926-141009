import { Hono } from "hono";
import { Env } from "./core-utils";
const observability = new Hono<{ Bindings: Env }>();
// Health check endpoint
observability.get('/api/health', async (c) => {
  try {
    // Check D1 connectivity
    await c.env.MEDICALCOR_DB.prepare("SELECT 1").first();
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      checks: {
        d1: 'ok',
      },
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      checks: {
        d1: 'error',
      },
      error: error.message,
    }, 503);
  }
});
// Prometheus-compatible metrics endpoint
observability.get('/api/metrics', async (c) => {
  const db = c.env.MEDICALCOR_DB;
  const leadsCount = await db.prepare("SELECT COUNT(*) as count FROM leads").first<{ count: number }>();
  const patientsCount = await db.prepare("SELECT COUNT(*) as count FROM patients").first<{ count: number }>();
  const appointmentsCount = await db.prepare("SELECT COUNT(*) as count FROM appointments").first<{ count: number }>();
  const metrics = [
    `# HELP crm_leads_total Total number of leads.`,
    `# TYPE crm_leads_total gauge`,
    `crm_leads_total ${leadsCount?.count ?? 0}`,
    `# HELP crm_patients_total Total number of patients.`,
    `# TYPE crm_patients_total gauge`,
    `crm_patients_total ${patientsCount?.count ?? 0}`,
    `# HELP crm_appointments_total Total number of appointments.`,
    `# TYPE crm_appointments_total gauge`,
    `crm_appointments_total ${appointmentsCount?.count ?? 0}`,
  ].join('\n');
  return new Response(metrics, {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
});
export const observabilityRoutes = observability;