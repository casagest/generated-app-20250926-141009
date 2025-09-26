-- D1 Migration
-- Version: 0008
-- Description: Adds a table for managing patient disputes.
CREATE TABLE IF NOT EXISTS disputes (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')) DEFAULT 'Open',
    created_by TEXT NOT NULL, -- User ID or name
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TEXT,
    resolution_details TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_disputes_patient_id ON disputes(patient_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);