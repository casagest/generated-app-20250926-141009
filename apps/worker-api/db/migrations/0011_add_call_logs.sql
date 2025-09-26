-- D1 Migration
-- Version: 0011
-- Description: Adds a table for call logs to support PBX integration.
CREATE TABLE IF NOT EXISTS call_logs (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    lead_id TEXT,
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('inbound', 'outbound')),
    duration_seconds INTEGER NOT NULL,
    recording_url TEXT,
    ai_summary TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_call_logs_patient_id ON call_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);