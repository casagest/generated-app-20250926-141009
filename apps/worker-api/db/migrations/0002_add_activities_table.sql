-- D1 Migration
-- Version: 0002
-- Description: Adds a table to log system activities for audit and display.
CREATE TABLE IF NOT EXISTS activities (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    description TEXT NOT NULL,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    details TEXT -- JSON object for extra data
);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);