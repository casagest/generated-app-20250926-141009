-- D1 Migration
-- Version: 0007
-- Description: Adds a table for dynamic escrow rules to split payments.
CREATE TABLE IF NOT EXISTS escrow_rules (
    id TEXT PRIMARY KEY,
    clinic_share_percentage REAL NOT NULL,
    agency_share_percentage REAL NOT NULL,
    start_date TEXT NOT NULL, -- ISO 8601 format
    end_date TEXT, -- ISO 8601 format, NULLABLE for indefinite rules
    is_active BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Seed the initial 88/12 rule as requested.
INSERT INTO escrow_rules (id, clinic_share_percentage, agency_share_percentage, start_date, is_active)
VALUES ('initial_rule', 88.0, 12.0, '2024-01-01T00:00:00Z', 1);