-- D1 Migration
-- Version: 0014
-- Description: Adds a table for storing daily aggregated KPIs.
CREATE TABLE IF NOT EXISTS kpi_daily (
    date TEXT PRIMARY KEY, -- YYYY-MM-DD format
    new_leads INTEGER NOT NULL,
    consultations_scheduled INTEGER NOT NULL,
    treatments_started INTEGER NOT NULL,
    conversion_rate REAL NOT NULL,
    total_revenue REAL NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_kpi_daily_date ON kpi_daily(date);