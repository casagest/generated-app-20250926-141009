-- D1 Migration
-- Version: 0004
-- Description: Adds a table for marketing campaigns to track costs for CAC/ROAS calculations.
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source TEXT NOT NULL CHECK(source IN ('Website', 'Referral', 'Social Media', 'Advertisement', 'Chatbot')),
    cost REAL NOT NULL,
    start_date TEXT NOT NULL, -- ISO 8601 format
    end_date TEXT NOT NULL -- ISO 8601 format
);
-- Seed initial marketing campaign data
INSERT INTO marketing_campaigns (id, name, source, cost, start_date, end_date) VALUES
('camp1', 'Google Ads - Q2', 'Advertisement', 5000.00, '2024-04-01T00:00:00Z', '2024-06-30T23:59:59Z'),
('camp2', 'Facebook Campaign - May', 'Social Media', 2500.00, '2024-05-01T00:00:00Z', '2024-05-31T23:59:59Z'),
('camp3', 'Website SEO Improvement', 'Website', 3000.00, '2024-01-01T00:00:00Z', '2024-12-31T23:59:59Z');