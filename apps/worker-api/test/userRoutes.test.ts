import { describe, it, expect, beforeAll } from 'vitest';
import worker from '../src/index';
import { getRequestContext, seedD1 } from './helpers';
import { Lead } from '@shared/types';
describe('User Routes API', () => {
  beforeAll(async () => {
    const { env } = getRequestContext();
    await seedD1(env.MEDICALCOR_DB);
  });
  it('GET /api/leads should return a list of leads', async () => {
    const { env, cf, ctx } = getRequestContext();
    const req = new Request('http://localhost/api/leads');
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const body = await res.json<{ success: boolean; data: Lead[] }>();
    expect(body.success).toBe(true);
    expect(body.data).toBeInstanceOf(Array);
    expect(body.data.length).toBe(2);
    expect(body.data[0].name).toBe('Test User 2'); // Ordered by created_at DESC
    expect(body.data[1].name).toBe('Test User 1');
  });
});