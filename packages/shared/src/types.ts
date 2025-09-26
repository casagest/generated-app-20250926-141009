export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }
export interface WeatherResult {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
}
export interface MCPResult {
  content: string;
}
export interface ErrorResult {
  error: string;
}
export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}
// Core CRM Types aligned with D1 Schema
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Consultation Scheduled' | 'Treatment Proposed' | 'Treatment Started';
export type LeadSource = 'Website' | 'Referral' | 'Social Media' | 'Advertisement' | 'Chatbot';
export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: LeadStatus;
    aiScore: number;
    ai_explanation?: string | null;
    ai_next_action?: string | null;
    source: LeadSource;
    assignedTo: string;
    lastContacted: string; // ISO 8601 format
    createdAt: string; // ISO 8601 format
    avatarUrl: string;
    // UTM Attribution Fields
    utm_source?: string | null;
    utm_medium?: string | null;
    utm_campaign?: string | null;
    utm_term?: string | null;
    utm_content?: string | null;
}
export interface Patient extends Lead {
    patientId: string; // The human-readable ID like P001
    dateOfBirth: string; // YYYY-MM-DD
    address: string;
    treatmentPlan?: string;
    totalBilled: number;
    totalPaid: number;
}
export interface Appointment {
    id: string;
    patientId: string; // The human-readable patient ID
    patientName: string;
    type: 'Consultation' | 'Treatment' | 'Follow-up';
    doctor: string;
    startTime: string; // ISO 8601 format
    endTime: string; // ISO 8601 format
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}
export interface Communication {
    id: string;
    type: 'Call' | 'Email' | 'SMS' | 'Note';
    date: string; // ISO 8601 format
    summary: string;
    author: string;
}
export interface Document {
    id: string;
    name: string;
    type: 'X-Ray' | 'Treatment Plan' | 'Invoice' | 'Consent Form';
    uploadDate: string; // YYYY-MM-DD
    url: string; // This is the R2 object key
}
export interface KpiCard {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
}
export interface LeadTrendData {
  month: string;
  newLeads: number;
  convertedLeads: number;
}
export type PnlData = {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
};
export type FinancialSummary = {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  monthlyPnl: PnlData[];
};
export type MarketingMetrics = {
  cac: number; // Customer Acquisition Cost
  roas: number; // Return on Ad Spend
  leadsBySource: { source: string; count: number }[];
};
export type ConversionFunnelStep = {
  name: string;
  value: number;
};
export interface Agency {
  id: string;
  name: string;
  primarySource: LeadSource;
  totalLeads: number;
  conversionRate: number;
  costPerLead: number;
  totalCommission: number;
  monthlyPerformance: { month: string; leads: number }[];
  contract_version?: string | null;
}
export interface Role {
  id: string;
  name: string;
  permissions: string[];
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}
export interface Activity {
  id: string;
  type: 'LEAD_CREATED' | 'CALL_CENTER_NOTIFIED' | 'DUPLICATE_LEAD_IGNORED';
  description: string;
  timestamp: string;
  details: string | null;
}
export interface Treatment {
    id: string;
    patient_id: string;
    name: string;
    description: string | null;
    cost: number;
    date: string; // ISO 8601 format
}
export interface Transaction {
    id: string;
    patient_id: string;
    type: 'Payment' | 'Refund' | 'Adjustment' | 'EscrowClinic' | 'EscrowAgency';
    amount: number;
    method: 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Insurance' | 'Internal' | null;
    date: string; // ISO 8601 format
    notes?: string | null;
    related_transaction_id?: string | null;
}
export interface LockStatus {
    locked: boolean;
    userId?: string;
    userName?: string;
    lockedAt?: number;
    message?: string;
}
export interface MarketingCampaign {
    id: string;
    name: string;
    source: LeadSource;
    cost: number;
    start_date: string; // ISO 8601 format
    end_date: string; // ISO 8601 format
}
export interface AuditLog {
    id: string;
    action: string;
    user_id?: string;
    target_id?: string;
    timestamp: string;
    details?: Record<string, any>;
}
export interface EscrowRule {
    id: string;
    clinic_share_percentage: number;
    agency_share_percentage: number;
    start_date: string;
    end_date: string | null;
    is_active: boolean;
    created_at: string;
}
export interface Dispute {
    id: string;
    patient_id: string;
    subject: string;
    description: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    created_by: string;
    created_at: string;
    resolved_at?: string | null;
    resolution_details?: string | null;
}
export interface CallLog {
    id: string;
    patient_id: string | null;
    lead_id: string | null;
    phone_number: string;
    direction: 'inbound' | 'outbound';
    duration_seconds: number;
    recording_url: string | null;
    ai_summary: string | null;
    created_at: string;
}
export interface UtmEvent {
    id?: string;
    event_type: 'page_view' | 'lead_created';
    session_id: string;
    lead_id?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    fbclid?: string;
}
export interface UtmReportData {
    campaignPerformance: {
        utm_source: string;
        utm_campaign: string;
        sessions: number;
        leads: number;
        conversion_rate: number;
    }[];
    sourcePerformance: {
        utm_source: string;
        sessions: number;
        leads: number;
    }[];
}
export interface AgencyContract {
    id: string;
    agency_id: string;
    name: string;
    status: 'Draft' | 'Active' | 'Archived';
    created_at: string;
    updated_at: string;
    versions?: AgencyContractVersion[];
}
export interface AgencyContractVersion {
    id: string;
    contract_id: string;
    version_number: number;
    status: 'Draft' | 'Active' | 'Superseded' | 'Terminated';
    start_date: string;
    end_date: string | null;
    settlement_logic: string; // JSON string
    created_at: string;
    kpi_targets?: AgencyKpiTarget[];
}
export interface AgencyKpiTarget {
    id: string;
    version_id: string;
    metric: string;
    target_value: number;
    period: 'Monthly' | 'Quarterly' | 'Annually';
    bonuses_penalties?: AgencyBonusPenalty[];
}
export interface AgencyBonusPenalty {
    id: string;
    kpi_target_id: string;
    type: 'Bonus' | 'Penalty';
    condition: string;
    value_type: 'Percentage' | 'FixedAmount';
    value: number;
}
export interface Settlement {
    id: string;
    contract_id: string;
    version_id: string;
    period_start: string;
    period_end: string;
    base_commission: number;
    bonus_amount: number;
    penalty_amount: number;
    total_payout: number;
    status: 'Pending' | 'Paid' | 'Disputed';
    created_at: string;
}
export interface DailyKpi {
    date: string; // YYYY-MM-DD
    new_leads: number;
    consultations_scheduled: number;
    treatments_started: number;
    conversion_rate: number;
    total_revenue: number;
}
export interface AgencyKpi {
    title: string;
    value: string;
    change: string;
    changeType: "increase" | "decrease" | "neutral";
    description: string;
}
export interface SettlementDetails extends Settlement {
    agency_name: string;
    contract_name: string;
    version_number: number;
}
export interface ImportJob {
    id: string;
    file_name: string;
    r2_key: string;
    status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
    total_rows: number | null;
    processed_rows: number | null;
    failed_rows: number | null;
    error_log: string | null;
    created_by: string;
    created_at: string;
    completed_at: string | null;
}
// Types for Chat Agent State
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  id: string;
  toolCalls?: ToolCall[];
}
export interface ChatState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  streamingMessage?: string;
}
export interface SessionInfo {
  id: string;
  title: string;
  createdAt: number;
  lastActive: number;
}
export interface Tool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
}
export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error';
  content: string;
}
export interface LeadIntakePayload {
  name: string;
  email: string;
  phone: string;
  interest?: string;
  source: LeadSource;
}