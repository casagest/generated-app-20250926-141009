import { Env } from './core-utils';
import { AgencyContract, AgencyContractVersion, Settlement } from '@shared/types';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import jsonLogic from 'json-logic-js';
export const settlementCronHandler = async (env: Env): Promise<void> => {
  console.log('Starting monthly agency settlement job...');
  const lastMonth = subMonths(new Date(), 1);
  const period_start = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
  const period_end = format(endOfMonth(lastMonth), 'yyyy-MM-dd');
  try {
    const { results: activeContracts } = await env.MEDICALCOR_DB.prepare(
      `SELECT ac.*, acv.id as version_id, acv.settlement_logic
       FROM agency_contracts ac
       JOIN agency_contract_versions acv ON ac.id = acv.contract_id
       WHERE ac.status = 'Active' AND acv.status = 'Active'`
    ).all<any>();
    for (const contract of activeContracts) {
      console.log(`Calculating settlement for agency: ${contract.agency_id}`);
      // 1. Gather performance data for the period
      const leadsData = await env.MEDICALCOR_DB.prepare(
        `SELECT COUNT(*) as count FROM leads
         WHERE source = (SELECT primary_source FROM agencies WHERE id = ?)
         AND created_at >= ? AND created_at <= ?`
      ).bind(contract.agency_id, `${period_start}T00:00:00Z`, `${period_end}T23:59:59Z`).first<{ count: number }>();
      const revenueData = await env.MEDICALCOR_DB.prepare(
        `SELECT SUM(t.amount) as total FROM transactions t
         JOIN leads l ON t.patient_id = l.id
         WHERE l.source = (SELECT primary_source FROM agencies WHERE id = ?)
         AND t.type = 'Payment' AND t.date >= ? AND t.date <= ?`
      ).bind(contract.agency_id, `${period_start}T00:00:00Z`, `${period_end}T23:59:59Z`).first<{ total: number }>();
      const performanceData = {
        leads_generated: leadsData?.count ?? 0,
        total_revenue_generated: revenueData?.total ?? 0,
        // Add more KPIs as needed by contracts
      };
      // 2. Apply JSONLogic rule
      const settlementRule = JSON.parse(contract.settlement_logic || '{}');
      const base_commission = jsonLogic.apply(settlementRule, performanceData);
      // 3. (Future) Calculate bonuses/penalties
      const bonus_amount = 0;
      const penalty_amount = 0;
      const total_payout = base_commission + bonus_amount - penalty_amount;
      // 4. Persist the settlement record
      const settlement: Omit<Settlement, 'created_at'> = {
        id: crypto.randomUUID(),
        contract_id: contract.id,
        version_id: contract.version_id,
        period_start,
        period_end,
        base_commission,
        bonus_amount,
        penalty_amount,
        total_payout,
        status: 'Pending',
      };
      await env.MEDICALCOR_DB.prepare(
        `INSERT INTO settlements (id, contract_id, version_id, period_start, period_end, base_commission, bonus_amount, penalty_amount, total_payout, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        settlement.id, settlement.contract_id, settlement.version_id, settlement.period_start, settlement.period_end,
        settlement.base_commission, settlement.bonus_amount, settlement.penalty_amount, settlement.total_payout, settlement.status
      ).run();
      console.log(`Settlement for ${contract.name} calculated: $${total_payout}`);
    }
    console.log('Monthly agency settlement job finished.');
  } catch (error) {
    console.error('Failed to run settlement job:', error);
  }
};