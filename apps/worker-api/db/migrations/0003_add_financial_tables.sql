-- D1 Migration
-- Version: 0003
-- Description: Adds tables for treatments and financial transactions.
PRAGMA foreign_keys = ON;
-- Table for specific treatments or services rendered to a patient.
CREATE TABLE IF NOT EXISTS treatments (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    cost REAL NOT NULL,
    date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- ISO 8601 format
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Table for financial transactions (payments, adjustments, etc.).
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('Payment', 'Refund', 'Adjustment')),
    amount REAL NOT NULL,
    method TEXT CHECK(method IN ('Cash', 'Credit Card', 'Bank Transfer', 'Insurance')),
    date TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, -- ISO 8601 format
    notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX IF NOT EXISTS idx_transactions_patient_id ON transactions(patient_id);
-- Seed some initial financial data for a more realistic demo
INSERT INTO treatments (id, patient_id, name, description, cost, date) VALUES
('treat1', 'lead1', 'Initial Consultation & X-Ray', 'Comprehensive oral examination and full mouth X-ray.', 150.00, '2024-05-10T10:00:00Z'),
('treat2', 'lead1', 'Teeth Whitening Session', 'In-office professional teeth whitening.', 450.00, '2024-05-20T14:30:00Z'),
('treat3', 'lead2', 'Dental Implant - Phase 1', 'Placement of titanium implant post.', 2500.00, '2024-06-01T09:00:00Z');
INSERT INTO transactions (id, patient_id, type, amount, method, date, notes) VALUES
('trans1', 'lead1', 'Payment', 150.00, 'Credit Card', '2024-05-10T11:00:00Z', 'Paid for consultation.'),
('trans2', 'lead1', 'Payment', 200.00, 'Credit Card', '2024-05-20T15:30:00Z', 'Deposit for whitening.'),
('trans3', 'lead2', 'Payment', 1000.00, 'Insurance', '2024-06-01T10:00:00Z', 'Insurance co-payment for implant.');