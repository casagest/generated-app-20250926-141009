-- D1 Migration
-- Version: 0009
-- Description: Adds columns for advanced AI lead scoring context to the leads table and a contract version to agencies.
-- Add columns to store the AI's reasoning and suggested next action for a lead.
ALTER TABLE leads ADD COLUMN ai_explanation TEXT;
ALTER TABLE leads ADD COLUMN ai_next_action TEXT;
-- Add a column to track the contract version for an agency, useful for dynamic escrow logic.
ALTER TABLE agencies ADD COLUMN contract_version TEXT;