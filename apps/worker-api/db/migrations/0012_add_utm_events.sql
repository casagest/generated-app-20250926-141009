-- D1 Migration
-- Version: 0012
-- Description: Adds a table for tracking UTM events and a view for analysis.
CREATE TABLE IF NOT EXISTS utm_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK(event_type IN ('page_view', 'lead_created')),
    session_id TEXT NOT NULL,
    lead_id TEXT,
    timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_term TEXT,
    utm_content TEXT,
    gclid TEXT,
    fbclid TEXT,
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_utm_events_session_id ON utm_events(session_id);
CREATE INDEX IF NOT EXISTS idx_utm_events_utm_source ON utm_events(utm_source);
CREATE INDEX IF NOT EXISTS idx_utm_events_utm_campaign ON utm_events(utm_campaign);
-- A view to simplify reporting on campaign performance
CREATE VIEW IF NOT EXISTS v_campaign_performance AS
SELECT
    utm_source,
    utm_campaign,
    COUNT(DISTINCT session_id) as sessions,
    COUNT(CASE WHEN event_type = 'lead_created' THEN 1 END) as leads,
    CAST(COUNT(CASE WHEN event_type = 'lead_created' THEN 1 END) AS REAL) * 100 / COUNT(DISTINCT session_id) as conversion_rate
FROM utm_events
WHERE utm_source IS NOT NULL AND utm_campaign IS NOT NULL
GROUP BY utm_source, utm_campaign;