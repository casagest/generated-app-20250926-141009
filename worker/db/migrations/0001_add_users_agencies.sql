-- D1 Migration
-- Version: 0001
-- Description: Adds tables for agencies, users, and roles, and seeds them with initial data.
PRAGMA foreign_keys = ON;
-- Table for marketing agencies
CREATE TABLE IF NOT EXISTS agencies (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_source TEXT NOT NULL CHECK(primary_source IN ('Website', 'Referral', 'Social Media', 'Advertisement')),
    total_leads INTEGER NOT NULL,
    conversion_rate REAL NOT NULL,
    cost_per_lead REAL NOT NULL,
    total_commission REAL NOT NULL
);
-- Table for user roles
CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    permissions TEXT -- JSON array of permissions
);
-- Table for system users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('Active', 'Inactive')),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);
-- Seed initial data for agencies
INSERT INTO agencies (id, name, primary_source, total_leads, conversion_rate, cost_per_lead, total_commission) VALUES
('agency1', 'Dental Marketers Inc.', 'Advertisement', 152, 18.0, 120.50, 16400.00),
('agency2', 'Smile Social Co.', 'Social Media', 210, 12.0, 85.00, 12750.00);
-- Seed initial data for roles
INSERT INTO roles (id, name, permissions) VALUES
('role1', 'Admin', '["all"]'),
('role2', 'Dentist', '["view_patients", "edit_treatments"]'),
('role3', 'Call Center', '["view_leads", "edit_leads"]');
-- Seed initial data for users
INSERT INTO users (id, name, email, role_id, status) VALUES
('user1', 'Dr. Evelyn Reed', 'e.reed@auradental.com', 'role1', 'Active'),
('user2', 'John Carter', 'j.carter@auradental.com', 'role3', 'Active'),
('user3', 'Samantha Blue', 's.blue@auradental.com', 'role2', 'Inactive');
-- Create a view for monthly performance (example, not fully dynamic in SQLite)
CREATE TABLE IF NOT EXISTS agency_monthly_performance (
    agency_id TEXT NOT NULL,
    month TEXT NOT NULL,
    leads INTEGER NOT NULL,
    PRIMARY KEY (agency_id, month),
    FOREIGN KEY (agency_id) REFERENCES agencies(id)
);
INSERT INTO agency_monthly_performance (agency_id, month, leads) VALUES
('agency1', 'Jan', 30), ('agency1', 'Feb', 45), ('agency1', 'Mar', 35), ('agency1', 'Apr', 42),
('agency2', 'Jan', 40), ('agency2', 'Feb', 55), ('agency2', 'Mar', 60), ('agency2', 'Apr', 55);