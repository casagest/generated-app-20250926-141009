-- D1 Migration
-- Version: 0013
-- Description: Adds tables for advanced agency contract management and settlements.
PRAGMA foreign_keys = ON;
-- Main table for agency contracts
CREATE TABLE IF NOT EXISTS agency_contracts (
    id TEXT PRIMARY KEY,
    agency_id TEXT NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Draft', 'Active', 'Archived')) DEFAULT 'Draft',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agency_id) REFERENCES agencies(id) ON DELETE CASCADE
);
-- Table for different versions of a contract
CREATE TABLE IF NOT EXISTS agency_contract_versions (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Draft', 'Active', 'Superseded', 'Terminated')) DEFAULT 'Draft',
    start_date TEXT NOT NULL,
    end_date TEXT,
    settlement_logic TEXT, -- JSONLogic rule for calculating settlements
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES agency_contracts(id) ON DELETE CASCADE,
    UNIQUE(contract_id, version_number)
);
-- Table for specific KPI targets within a contract version
CREATE TABLE IF NOT EXISTS agency_kpi_targets (
    id TEXT PRIMARY KEY,
    version_id TEXT NOT NULL,
    metric TEXT NOT NULL, -- e.g., 'lead_conversion_rate', 'cost_per_lead'
    target_value REAL NOT NULL,
    period TEXT NOT NULL CHECK(period IN ('Monthly', 'Quarterly', 'Annually')),
    FOREIGN KEY (version_id) REFERENCES agency_contract_versions(id) ON DELETE CASCADE
);
-- Table for bonuses or penalties associated with KPI targets
CREATE TABLE IF NOT EXISTS agency_bonuses_penalties (
    id TEXT PRIMARY KEY,
    kpi_target_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Bonus', 'Penalty')),
    condition TEXT NOT NULL, -- e.g., '>=', '<'
    value_type TEXT NOT NULL CHECK(value_type IN ('Percentage', 'FixedAmount')),
    value REAL NOT NULL,
    FOREIGN KEY (kpi_target_id) REFERENCES agency_kpi_targets(id) ON DELETE CASCADE
);
-- Table to store the results of periodic financial settlements with agencies
CREATE TABLE IF NOT EXISTS settlements (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    period_start TEXT NOT NULL,
    period_end TEXT NOT NULL,
    base_commission REAL NOT NULL,
    bonus_amount REAL NOT NULL,
    penalty_amount REAL NOT NULL,
    total_payout REAL NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Pending', 'Paid', 'Disputed')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES agency_contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (version_id) REFERENCES agency_contract_versions(id) ON DELETE CASCADE
);
CREATE INDEX idx_contracts_agency_id ON agency_contracts(agency_id);
CREATE INDEX idx_versions_contract_id ON agency_contract_versions(contract_id);
CREATE INDEX idx_kpi_targets_version_id ON agency_kpi_targets(version_id);
CREATE INDEX idx_settlements_contract_id ON settlements(contract_id);