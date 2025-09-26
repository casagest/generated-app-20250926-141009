import { Env } from './core-utils';
import { format, subDays } from 'date-fns';
export const kpiCronHandler = async (env: Env): Promise<void> => {
  console.log('Starting daily KPI aggregation job...');
  const yesterday = subDays(new Date(), 1);
  const date = format(yesterday, 'yyyy-MM-dd');
  const startOfDay = `${date}T00:00:00Z`;
  const endOfDay = `${date}T23:59:59Z`;
  try {
    const db = env.MEDICALCOR_DB;
    // 1. New Leads
    const newLeadsResult = await db.prepare(
      "SELECT COUNT(*) as count FROM leads WHERE created_at >= ? AND created_at <= ?"
    ).bind(startOfDay, endOfDay).first<{ count: number }>();
    const new_leads = newLeadsResult?.count ?? 0;
    // 2. Consultations Scheduled
    const consultationsResult = await db.prepare(
      "SELECT COUNT(*) as count FROM appointments WHERE type = 'Consultation' AND start_time >= ? AND start_time <= ?"
    ).bind(startOfDay, endOfDay).first<{ count: number }>();
    const consultations_scheduled = consultationsResult?.count ?? 0;
    // 3. Treatments Started
    const treatmentsResult = await db.prepare(
      "SELECT COUNT(DISTINCT patient_id) as count FROM treatments WHERE date >= ? AND date <= ?"
    ).bind(startOfDay, endOfDay).first<{ count: number }>();
    const treatments_started = treatmentsResult?.count ?? 0;
    // 4. Conversion Rate
    const conversion_rate = new_leads > 0 ? (treatments_started / new_leads) * 100 : 0;
    // 5. Total Revenue
    const revenueResult = await db.prepare(
      "SELECT SUM(amount) as total FROM transactions WHERE type = 'Payment' AND date >= ? AND date <= ?"
    ).bind(startOfDay, endOfDay).first<{ total: number }>();
    const total_revenue = revenueResult?.total ?? 0;
    // 6. Insert or Replace the daily KPI record
    await db.prepare(
      `INSERT OR REPLACE INTO kpi_daily (date, new_leads, consultations_scheduled, treatments_started, conversion_rate, total_revenue)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(date, new_leads, consultations_scheduled, treatments_started, conversion_rate, total_revenue).run();
    console.log(`Successfully aggregated KPIs for ${date}`);
  } catch (error) {
    console.error(`Failed to aggregate KPIs for ${date}:`, error);
  }
};