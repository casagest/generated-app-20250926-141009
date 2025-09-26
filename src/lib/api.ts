import {
  Lead,
  Patient,
  Appointment,
  Communication,
  Document,
  KpiCard,
  LeadTrendData,
  LeadStatus,
  FinancialSummary,
  MarketingMetrics,
  ConversionFunnelStep,
  Agency,
  User,
  Role,
} from "./types";
type DashboardStats = {
  kpiData: Omit<KpiCard, "icon">[];
  leadTrendData: LeadTrendData[];
  upcomingAppointments: Appointment[];
  recentLeads: Lead[];
};
type FullReportData = {
  financialSummary: FinancialSummary;
  marketingMetrics: MarketingMetrics;
  conversionFunnel: ConversionFunnelStep[];
};
type UsersAndRolesData = {
  users: User[];
  roles: Role[];
};
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: "An unknown error occurred" }));
    throw new Error(errorBody.error || `Request failed with status ${res.status}`);
  }
  const { data } = await res.json();
  return data as T;
}
// Dashboard
export const getDashboardStats = (): Promise<DashboardStats> => fetcher<DashboardStats>("/api/dashboard-stats");
// Leads
export const getLeads = (): Promise<Lead[]> => fetcher<Lead[]>("/api/leads");
export const createLead = (leadData: { name: string; email: string; phone?: string; source: string; }): Promise<Lead> => {
  return fetcher<Lead>("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  });
};
export const updateLeadStatus = ({ id, status }: { id: string; status: LeadStatus }): Promise<Patient> => {
  return fetcher<Patient>(`/api/patients/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
};
// Patient Detail
export const getPatientDetails = (id: string): Promise<Patient> => fetcher<Patient>(`/api/patients/${id}`);
export const getPatientAppointments = (id: string): Promise<Appointment[]> => fetcher<Appointment[]>(`/api/patients/${id}/appointments`);
export const getPatientCommunications = (id: string): Promise<Communication[]> => fetcher<Communication[]>(`/api/patients/${id}/communications`);
export const getPatientDocuments = (id: string): Promise<Document[]> => fetcher<Document[]>(`/api/patients/${id}/documents`);
// Reports
export const getFullReportData = (): Promise<FullReportData> => fetcher<FullReportData>("/api/reports/full");
// Calendar
export const getAppointments = (): Promise<Appointment[]> => fetcher<Appointment[]>("/api/appointments");
// Agency Portal
export const getAgencies = (): Promise<Agency[]> => fetcher<Agency[]>("/api/agencies");
// Settings
export const getUsersAndRoles = (): Promise<UsersAndRolesData> => fetcher<UsersAndRolesData>("/api/users-roles");