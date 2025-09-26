import {
  Lead, Patient, Appointment, Communication, Document, KpiCard, LeadTrendData, LeadStatus,
  FinancialSummary, MarketingMetrics, ConversionFunnelStep, Agency, User, Role, Activity,
  Treatment, Transaction, LockStatus, EscrowRule, Dispute, CallLog, UtmEvent, UtmReportData,
  AgencyContract, AgencyContractVersion, DailyKpi, Settlement, AgencyKpi, SettlementDetails, ImportJob
} from "@shared/types";
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
type PatientFinancials = {
    treatments: Treatment[];
    transactions: Transaction[];
}
async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ error: "An unknown error occurred", message: `Request failed with status ${res.status}` }));
    throw new Error(errorBody.message || errorBody.error);
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return {} as T;
  }
  const responseJson = await res.json();
  return (responseJson.data || responseJson) as T;
}
// Data Import
export const initiateImport = async (file: File, userEmail: string): Promise<{ jobId: string }> => {
    const { url, key } = await fetcher<{ url: string; key: string }>("/api/files/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, patientId: 'imports' }), // Use a generic path for imports
    });
    const uploadResponse = await fetch(url, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
    if (!uploadResponse.ok) throw new Error("Failed to upload file to R2.");
    return fetcher<{ jobId: string }>("/api/import/leads", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ r2Key: key, fileName: file.name, createdBy: userEmail }),
    });
};
export const getImportHistory = (): Promise<ImportJob[]> => fetcher<ImportJob[]>("/api/import/history");
// Agency Portal
const getAgencyHeaders = () => ({ 'X-Agency-ID': 'agency1' }); // Mocking agency auth
export const getAgencyKpis = (): Promise<AgencyKpi[]> => fetcher<AgencyKpi[]>("/api/agency/kpis", { headers: getAgencyHeaders() });
export const getAgencySettlements = (): Promise<SettlementDetails[]> => fetcher<SettlementDetails[]>("/api/agency/settlements", { headers: getAgencyHeaders() });
export const getAgencyContractLogic = (): Promise<{ logic: any }> => fetcher<{ logic: any }>("/api/agency/contract-logic", { headers: getAgencyHeaders() });
// Settlements
export const getSettlements = (): Promise<(Settlement & { contract_name: string; agency_name: string })[]> => fetcher<any>("/api/settlements");
// KPI Reporting
export const getKpiHistory = ({ startDate, endDate }: { startDate: string; endDate: string }): Promise<DailyKpi[]> => {
    return fetcher<DailyKpi[]>(`/api/reports/kpi?startDate=${startDate}&endDate=${endDate}`);
};
export const exportKpiReport = ({ startDate, endDate }: { startDate: string; endDate: string }): Promise<{ url: string }> => {
    return fetcher<{ url: string }>("/api/reports/kpi/export", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate }),
    });
};
// Dispute Management
export const getDisputes = (patientId: string): Promise<Dispute[]> => fetcher<Dispute[]>(`/api/patients/${patientId}/disputes`);
export const createDispute = (patientId: string, disputeData: { subject: string; description: string; created_by: string }): Promise<Dispute> => {
    return fetcher<Dispute>(`/api/patients/${patientId}/disputes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(disputeData),
    });
};
export const updateDisputeStatus = (disputeId: string, data: { status: Dispute['status'], resolution_details?: string, user: string }): Promise<Dispute> => {
    return fetcher<Dispute>(`/api/disputes/${disputeId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
};
// Contract Management
export const getContracts = (): Promise<AgencyContract[]> => fetcher<AgencyContract[]>("/api/contracts");
export const createContract = (contractData: { agency_id: string; name: string }): Promise<AgencyContract> => {
    return fetcher<AgencyContract>("/api/contracts", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contractData),
    });
};
export const createContractVersion = (contractId: string, versionData: Partial<AgencyContractVersion>): Promise<AgencyContractVersion> => {
    return fetcher<AgencyContractVersion>(`/api/contracts/${contractId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(versionData),
    });
};
// Dashboard
export const getDashboardStats = (): Promise<DashboardStats> => fetcher<DashboardStats>("/api/dashboard-stats");
export const getActivities = (): Promise<Activity[]> => fetcher<Activity[]>("/api/activities");
// Leads
export const getLeads = (): Promise<Lead[]> => fetcher<Lead[]>("/api/leads");
export const createLead = (leadData: { name: string; email: string; phone?: string; source: string; }): Promise<Lead> => {
  return fetcher<Lead>("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  });
};
export const updateLeadStatus = ({ id, status, userId }: { id: string; status: LeadStatus, userId: string }): Promise<Patient> => {
  return fetcher<Patient>(`/api/patients/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, userId }),
  });
};
// Patient Detail
export const getPatientDetails = (id: string): Promise<Patient> => fetcher<Patient>(`/api/patients/${id}`);
export const getPatientAppointments = (id: string): Promise<Appointment[]> => fetcher<Appointment[]>(`/api/patients/${id}/appointments`);
export const getPatientCommunications = (id: string): Promise<Communication[]> => fetcher<Communication[]>(`/api/patients/${id}/communications`);
export const getPatientDocuments = (id: string): Promise<Document[]> => fetcher<Document[]>(`/api/patients/${id}/documents`);
export const getPatientFinancials = (id: string): Promise<PatientFinancials> => fetcher<PatientFinancials>(`/api/patients/${id}/financials`);
export const getCallLogs = (patientId: string): Promise<CallLog[]> => fetcher<CallLog[]>(`/api/patients/${patientId}/calls`);
export const recordPayment = (patientId: string, paymentData: Omit<Transaction, 'id' | 'patient_id' | 'type' | 'related_transaction_id'>): Promise<Transaction> => {
    return fetcher<Transaction>(`/api/patients/${patientId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
    });
};
// Reports
export const getFullReportData = (): Promise<FullReportData> => fetcher<FullReportData>("/api/reports/full");
export const getUtmReport = (): Promise<UtmReportData> => fetcher<UtmReportData>("/api/reports/utm");
// Calendar
export const getAppointments = (): Promise<Appointment[]> => fetcher<Appointment[]>("/api/appointments");
// Agency Portal (Admin view)
export const getAgencies = (): Promise<Agency[]> => fetcher<Agency[]>("/api/agencies");
// Settings
export const getUsersAndRoles = (): Promise<UsersAndRolesData> => fetcher<UsersAndRolesData>("/api/users-roles");
export const getEscrowRules = (): Promise<EscrowRule[]> => fetcher<EscrowRule[]>("/api/settings/escrow");
export const createEscrowRule = (ruleData: Omit<EscrowRule, 'id' | 'is_active' | 'created_at'>): Promise<EscrowRule> => {
    return fetcher<EscrowRule>("/api/settings/escrow", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
    });
};
// R2 File Management
export const getSignUploadUrl = (
    { filename, contentType, patientId }: { filename: string; contentType: string; patientId: string }
): Promise<{ url: string; key: string }> => {
    return fetcher<{ url: string; key: string }>("/api/files/sign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, contentType, patientId }),
    });
};
export const uploadFileToR2 = async (url: string, file: File): Promise<Response> => {
    return fetch(url, {
        method: 'PUT',
        body: file,
        headers: {
            'Content-Type': file.type,
        },
    });
};
export const createDocumentRecord = (
    patientId: string,
    doc: { name: string; type: Document['type']; url: string }
): Promise<Document> => {
    return fetcher<Document>(`/api/patients/${patientId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
    });
};
export const getSignedDownloadUrl = (key: string): Promise<{ url: string }> => {
    return fetcher<{ url: string }>(`/api/files/sign-download/${encodeURIComponent(key)}`);
};
// Lead Locking
export const acquireLeadLock = (id: string, user: { userId: string; userName: string }): Promise<LockStatus> => {
    return fetcher<LockStatus>(`/api/leads/${id}/lock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
};
export const releaseLeadLock = (id: string, user: { userId: string }): Promise<LockStatus> => {
    return fetcher<LockStatus>(`/api/leads/${id}/unlock`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
};
export const getLeadLockStatus = (id: string): Promise<LockStatus> => fetcher<LockStatus>(`/api/leads/${id}/lock_status`);
// UTM Attribution
export const logUtmEvent = (event: UtmEvent): Promise<{ success: boolean }> => {
    return fetcher<{ success: boolean }>("/api/utm-events", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
    });
};