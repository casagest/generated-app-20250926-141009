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
    source: LeadSource;
    assignedTo: string;
    lastContacted: string; // ISO 8601 format
    createdAt: string; // ISO 8601 format
    avatarUrl: string;
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
    url: string;
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
export interface Agency {
  id: string;
  name: string;
  primarySource: LeadSource;
  totalLeads: number;
  conversionRate: number;
  costPerLead: number;
  totalCommission: number;
  monthlyPerformance: { month: string; leads: number }[];
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