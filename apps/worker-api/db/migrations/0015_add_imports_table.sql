-- D1 Migration
-- Version: 0015
-- Description: Adds a table to track data import jobs.
CREATE TABLE IF NOT EXISTS import_jobs (
    id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Processing', 'Completed', 'Failed')) DEFAULT 'Pending',
    total_rows INTEGER,
    processed_rows INTEGER,
    failed_rows INTEGER,
    error_log TEXT,
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);