-- D1 Initial Schema Migration
-- Version: 0000
-- Description: Sets up the initial tables for the Aura Dental CRM.
-- Enforces foreign key constraints.
PRAGMA foreign_keys = ON;
-- Table for leads, which are potential patients.
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    status TEXT NOT NULL CHECK(status IN ('New', 'Contacted', 'Qualified', 'Consultation Scheduled', 'Treatment Proposed', 'Treatment Started')),
    ai_score INTEGER NOT NULL DEFAULT 50,
    source TEXT NOT NULL CHECK(source IN ('Website', 'Referral', 'Social Media', 'Advertisement', 'Chatbot')),
    assigned_to TEXT,
    last_contacted_at TEXT, -- ISO 8601 format
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    avatar_url TEXT
);
-- Table for patients, who are converted leads.
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY, -- Corresponds to a lead ID
    patient_id_serial INTEGER PRIMARY KEY AUTOINCREMENT, -- For human-readable IDs like P001
    date_of_birth TEXT, -- YYYY-MM-DD
    address TEXT,
    treatment_plan TEXT,
    total_billed REAL DEFAULT 0.0,
    total_paid REAL DEFAULT 0.0,
    FOREIGN KEY (id) REFERENCES leads(id) ON DELETE CASCADE
);
-- Table for appointments.
CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Consultation', 'Treatment', 'Follow-up')),
    doctor TEXT,
    start_time TEXT NOT NULL, -- ISO 8601 format
    end_time TEXT NOT NULL, -- ISO 8601 format
    status TEXT NOT NULL CHECK(status IN ('Scheduled', 'Completed', 'Cancelled')),
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Table for communication history with patients.
CREATE TABLE IF NOT EXISTS communications (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Call', 'Email', 'SMS', 'Note')),
    date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- ISO 8601 format
    summary TEXT NOT NULL,
    author TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Table for patient-related documents.
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('X-Ray', 'Treatment Plan', 'Invoice', 'Consent Form')),
    upload_date TEXT NOT NULL, -- YYYY-MM-DD
    url TEXT NOT NULL,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Indexes for performance on frequently queried columns.
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_communications_patient_id ON communications(patient_id);