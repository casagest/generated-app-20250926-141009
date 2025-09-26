import type { AppController } from './app-controller';
import type { ChatAgent } from './agent';
import { D1Database, R2Bucket, Queue, VectorizeIndex, DurableObjectNamespace } from '@cloudflare/workers-types';
export interface Env {
    CF_AI_BASE_URL: string;
    CF_AI_API_KEY: string;
    SERPAPI_KEY: string;
    OPENROUTER_API_KEY: string;
    CHAT_AGENT: DurableObjectNamespace<ChatAgent>;
    APP_CONTROLLER: DurableObjectNamespace<AppController>;
    LEAD_LOCK_DO: DurableObjectNamespace;
    SESSION_DO: DurableObjectNamespace;
    DISPUTE_DO: DurableObjectNamespace;
    MEDICALCOR_DB: D1Database;
    MEDICALCOR_FILES: R2Bucket;
    MEDICALCOR_KB: VectorizeIndex;
    LEAD_QUEUE: Queue;
    KB_INGESTION_QUEUE: Queue;
    AUDIT_QUEUE: Queue;
    MEDIA_QUEUE: Queue;
    LEAD_INTAKE_QUEUE: Queue;
    TRANSCRIPTION_QUEUE: Queue;
    IMPORT_QUEUE: Queue;
}
export function getAppController(env: Env): DurableObjectStub<AppController> {
  const id = env.APP_CONTROLLER.idFromName("controller");
  return env.APP_CONTROLLER.get(id);
}
export async function registerSession(env: Env, sessionId: string, title?: string): Promise<void> {
  try {
    const controller = getAppController(env);
    await controller.addSession(sessionId, title);
  } catch (error) {
    console.error('Failed to register session:', error);
  }
}
export async function updateSessionActivity(env: Env, sessionId: string): Promise<void> {
  try {
    const controller = getAppController(env);
    await controller.updateSessionActivity(sessionId);
  } catch (error) {
    console.error('Failed to update session activity:', error);
  }
}
export async function unregisterSession(env: Env, sessionId: string): Promise<boolean> {
  try {
    const controller = getAppController(env);
    return await controller.removeSession(sessionId);
  } catch (error) {
    console.error('Failed to unregister session:', error);
    return false;
  }
}