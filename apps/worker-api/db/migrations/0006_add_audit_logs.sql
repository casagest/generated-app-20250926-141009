-- D1 Migration
-- Version: 0006
-- Description: Adds a table for immutable audit logs of critical system actions.
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    user_id TEXT, -- The user who performed the action (e.g., email)
    target_id TEXT, -- The ID of the entity being acted upon (e.g., lead_id)
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT -- JSON object for extra data (e.g., old and new values)
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);