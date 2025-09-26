import { DurableObject } from 'cloudflare:workers';
import { Env } from './core-utils';
import { Dispute } from '@shared/types';
type DisputeStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';
export class DisputeDO extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    async create(disputeData: Omit<Dispute, 'id' | 'created_at' | 'status'>): Promise<Dispute> {
        const id = this.ctx.id.toString();
        const timestamp = new Date().toISOString();
        const newDispute: Dispute = {
            ...disputeData,
            id,
            status: 'Open',
            created_at: timestamp,
        };
        await this.ctx.storage.put('dispute', newDispute);
        // Also write to D1 for list views
        await this.env.MEDICALCOR_DB.prepare(
            `INSERT INTO disputes (id, patient_id, subject, description, status, created_by, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, newDispute.patient_id, newDispute.subject, newDispute.description, newDispute.status, newDispute.created_by, newDispute.created_at).run();
        return newDispute;
    }
    async updateStatus(newStatus: DisputeStatus, details: { resolution_details?: string, user: string }): Promise<Dispute> {
        const dispute = await this.ctx.storage.get<Dispute>('dispute');
        if (!dispute) {
            throw new Error("Dispute not found");
        }
        dispute.status = newStatus;
        if (newStatus === 'Resolved' || newStatus === 'Closed') {
            dispute.resolved_at = new Date().toISOString();
            dispute.resolution_details = details.resolution_details || dispute.resolution_details;
        }
        await this.ctx.storage.put('dispute', dispute);
        // Update D1 as well
        await this.env.MEDICALCOR_DB.prepare(
            `UPDATE disputes SET status = ?, resolved_at = ?, resolution_details = ? WHERE id = ?`
        ).bind(dispute.status, dispute.resolved_at, dispute.resolution_details, this.ctx.id.toString()).run();
        return dispute;
    }
    async get(): Promise<Dispute | undefined> {
        return this.ctx.storage.get<Dispute>('dispute');
    }
}