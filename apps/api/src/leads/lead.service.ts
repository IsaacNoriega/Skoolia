import { Injectable, Inject } from '@nestjs/common';
import { DATABASE } from '../db/db.module';
import type { Database } from '../db/db.types';
import { leads } from '../../drizzle/schemas/leads';
import { publicUsers } from '../../drizzle/schemas/users/public-users';
import { eq, and, desc } from 'drizzle-orm';
import type { LeadStatus, LeadOriginType, LeadTrigger } from './lead.types';

@Injectable()
export class LeadService {
  constructor(@Inject(DATABASE) private db: Database) {}

  private statusPriority = {
    NUEVO: 1,
    INTERESADO: 2,
    VISITA: 3,
    INSCRITO: 4,
  };

  async upsertLead(params: {
    userId: string;
    targetId: string;
    originType: LeadOriginType;
    status: LeadStatus;
    lastTrigger: LeadTrigger;
    metadata?: any;
  }): Promise<any> {
    const {
      userId,
      targetId,
      originType,
      status,
      lastTrigger,
      metadata,
    }: {
      userId: string;
      targetId: string;
      originType: LeadOriginType;
      status: LeadStatus;
      lastTrigger: LeadTrigger;
      metadata?: any;
    } = params;
    // Buscar lead existente
    const existingRows = await this.db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.userId, userId),
          eq(leads.targetId, targetId),
          eq(leads.originType, originType),
        ),
      );
    const existing = existingRows[0];
    if (!existing) {
      // Insertar nuevo lead
      const [created] = await this.db
        .insert(leads)
        .values({ userId, targetId, originType, status, lastTrigger, metadata })
        .returning();
      return created;
    }
    const shouldUpdateStatus =
      this.statusPriority[status] > this.statusPriority[existing.status];
    // Actualizar lead existente
    const [updated] = await this.db
      .update(leads)
      .set({
        lastTrigger,
        status: shouldUpdateStatus ? status : existing.status,
        metadata: metadata ?? existing.metadata,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, existing.id))
      .returning();
    return updated;
  }

  async updateLeadMetadata(leadId: string, metadata: any) {
    const [updated] = await this.db
      .update(leads)
      .set({ metadata, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    return updated;
  }

  async getLeadsByOwner(
    ownerId: string,
    originType: LeadOriginType = 'SCHOOL',
  ) {
    // Join con public_users para obtener el nombre del padre (funciona para SCHOOL y COURSE)
    const results = await this.db
      .select({
        id: leads.id,
        userId: leads.userId,
        targetId: leads.targetId,
        originType: leads.originType,
        status: leads.status,
        lastTrigger: leads.lastTrigger,
        metadata: leads.metadata,
        createdAt: leads.createdAt,
        updatedAt: leads.updatedAt,
        userName: publicUsers.name,
      })
      .from(leads)
      .leftJoin(publicUsers, eq(leads.userId, publicUsers.id))
      .where(and(eq(leads.targetId, ownerId), eq(leads.originType, originType)))
      .orderBy(desc(leads.updatedAt));
    return results;
  }

  async updateLeadStatus(leadId: string, status: LeadStatus) {
    const [updated] = await this.db
      .update(leads)
      .set({ status, updatedAt: new Date() })
      .where(eq(leads.id, leadId))
      .returning();
    return updated;
  }
}
