export type KpiCard = {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ElementType;
};
export type LeadStatus =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Consultation Scheduled"
  | "Treatment Proposed"
  | "Treatment Started";
export type LeadSource = "Website" | "Referral" | "Social Media" | "Advertisement" | "Chatbot";
export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  aiScore: number;
  source: LeadSource;
  assignedTo: string;
  lastContacted: string;
  createdAt: string;
  avatarUrl: string;
};
export type Patient = Lead & {
  patientId: string;
  dateOfBirth: string;
  address: string;
  nextAppointment?: string;
  treatmentPlan?: string;
  totalBilled: number;
  totalPaid: number;
};
export type Appointment = {
  id: string;
  patientName: string;
  patientId: string;
  type: "Consultation" | "Treatment" | "Follow-up";
  doctor: string;
  startTime: string;
  endTime: string;
  status: "Scheduled" | "Completed" | "Cancelled";
};
export type Communication = {
  id: string;
  type: "Call" | "Email" | "SMS" | "Note";
  date: string;
  summary: string;
  author: string;
};
export type Document = {
  id: string;
  name: string;
  type: "X-Ray" | "Treatment Plan" | "Invoice" | "Consent Form";
  uploadDate: string;
  url: string;
};
export type LeadTrendData = {
  month: string;
  newLeads: number;
  convertedLeads: number;
};
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
export type Agency = {
  id: string;
  name: string;
  primarySource: LeadSource;
  totalLeads: number;
  conversionRate: number;
  costPerLead: number;
  totalCommission: number;
  monthlyPerformance: { month: string; leads: number }[];
};
export type Role = {
  id: string;
  name: string;
  permissions: string[];
};
export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
};