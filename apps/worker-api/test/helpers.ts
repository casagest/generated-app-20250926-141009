import { env } from 'cloudflare:test';
import { D1Database } from '@cloudflare/workers-types';
export async function seedD1(db: D1Database) {
  await db.exec(`
    DELETE FROM leads;
    INSERT INTO leads (id, name, email, phone, status, ai_score, source, assigned_to, last_contacted_at, created_at, avatar_url) VALUES
    ('lead-test-1', 'Test User 1', 'test1@example.com', '1112223333', 'New', 75, 'Website', 'Unassigned', '2024-01-01T12:00:00Z', '2024-01-01T12:00:00Z', 'avatar1.url'),
    ('lead-test-2', 'Test User 2', 'test2@example.com', '4445556666', 'Contacted', 85, 'Referral', 'Dr. Reed', '2024-01-02T12:00:00Z', '2024-01-02T12:00:00Z', 'avatar2.url');
  `);
}
export function getRequestContext() {
  return {
    env,
    cf: {},
    ctx: {
      waitUntil: () => Promise.resolve(),
      passThroughOnException: () => {},
    },
  };
}