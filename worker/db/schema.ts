// This file defines the TypeScript types that correspond to the database schema.
// It serves as a single source of truth for data structures.
export interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    status: 'New' | 'Contacted' | 'Qualified' | 'Consultation Scheduled' | 'Treatment Proposed' | 'Treatment Started';
    ai_score: number;
    source: 'Website' | 'Referral' | 'Social Media' | 'Advertisement';
    assigned_to: string;
    last_contacted_at: string; // ISO 8601 format
    created_at: string; // ISO 8601 format
    avatar_url: string;
}
export interface Patient {
    id: string; // This will be the same as the lead ID
    patient_id_serial: number; // The auto-incrementing patient number like P001
    date_of_birth: string; // YYYY-MM-DD
    address: string;
    treatment_plan: string | null;
    total_billed: number;
    total_paid: number;
}
export interface Appointment {
    id: string;
    patient_id: string;
    type: 'Consultation' | 'Treatment' | 'Follow-up';
    doctor: string;
    start_time: string; // ISO 8601 format
    end_time: string; // ISO 8601 format
    status: 'Scheduled' | 'Completed' | 'Cancelled';
}
export interface Communication {
    id: string;
    patient_id: string;
    type: 'Call' | 'Email' | 'SMS' | 'Note';
    date: string; // ISO 8601 format
    summary: string;
    author: string;
}
export interface Document {
    id: string;
    patient_id: string;
    name: string;
    type: 'X-Ray' | 'Treatment Plan' | 'Invoice' | 'Consent Form';
    upload_date: string; // YYYY-MM-DD
    url: string;
}