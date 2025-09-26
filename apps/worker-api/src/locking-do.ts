import { DurableObject } from 'cloudflare:workers';
import { Env } from './core-utils';
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutes
interface LockInfo {
    userId: string;
    userName: string;
    lockedAt: number;
}
export class LeadLockingDO extends DurableObject<Env> {
    private lock: LockInfo | null = null;
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const method = request.method;
        const path = url.pathname.slice(1);
        switch (path) {
            case 'lock':
                if (method === 'POST') {
                    const { userId, userName } = await request.json<{ userId: string; userName: string }>();
                    return this.acquireLock(userId, userName);
                }
                break;
            case 'unlock':
                if (method === 'DELETE') {
                    const { userId } = await request.json<{ userId: string }>();
                    return this.releaseLock(userId);
                }
                break;
            case 'status':
                if (method === 'GET') {
                    return this.getStatus();
                }
                break;
        }
        return new Response('Not Found', { status: 404 });
    }
    async alarm() {
        // Alarm triggered, meaning the lock has expired.
        console.log(`Lock expired for DO ${this.ctx.id.toString()}`);
        this.lock = null;
    }
    private acquireLock(userId: string, userName: string): Response {
        if (this.lock && this.lock.userId !== userId) {
            // Already locked by someone else
            return new Response(JSON.stringify({
                locked: true,
                ...this.lock,
                message: `Locked by ${this.lock.userName}.`
            }), { status: 409, headers: { 'Content-Type': 'application/json' } });
        }
        // Grant or refresh the lock
        this.lock = { userId, userName, lockedAt: Date.now() };
        this.ctx.storage.setAlarm(Date.now() + LOCK_DURATION_MS);
        return new Response(JSON.stringify({
            locked: true,
            ...this.lock,
            message: 'Lock acquired successfully.'
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    private releaseLock(userId: string): Response {
        if (this.lock && this.lock.userId === userId) {
            this.lock = null;
            this.ctx.storage.deleteAlarm();
            return new Response(JSON.stringify({ locked: false, message: 'Lock released.' }), { status: 200 });
        }
        if (this.lock) {
            return new Response(JSON.stringify({ locked: true, message: 'Cannot release lock held by another user.' }), { status: 403 });
        }
        return new Response(JSON.stringify({ locked: false, message: 'No active lock to release.' }), { status: 200 });
    }
    private getStatus(): Response {
        if (this.lock) {
            return new Response(JSON.stringify({ locked: true, ...this.lock }), { status: 200 });
        }
        return new Response(JSON.stringify({ locked: false }), { status: 200 });
    }
}