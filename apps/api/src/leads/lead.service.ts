import { Injectable, Inject } from '@nestjs/common';
import { DATABASE } from '../db/db.module';
import type { Database } from '../db/db.types';

import { leads } from '../../drizzle/schemas/leads';
import { publicUsers } from '../../drizzle/schemas/users/public-users';

import { eq, and, desc, inArray } from 'drizzle-orm';

import type { LeadStatus, LeadOriginType, LeadTrigger } from './lead.types';

@Injectable()
export class LeadService {
  constructor(@Inject(DATABASE) private db: Database) {}

  // 🔥 Prioridad de estados (para no retroceder leads)
  private statusPriority: Record<LeadStatus, number> = {
    NUEVO: 1,
    INTERESADO: 2,
    VISITA: 3,
    INSCRITO: 4,
  };

  // ✅ Obtener múltiples leads por IDs (FIX: sin duplicado)
  async getLeadsByTargetIds(
    targetIds: string[],
    originType: LeadOriginType,
  ) {
    if (!targetIds.length) return [];

    return this.db
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
      .where(
        and(
          inArray(leads.targetId, targetIds),
          eq(leads.originType, originType),
        ),
      )
      .orderBy(desc(leads.updatedAt));
  }

  // ✅ Upsert inteligente (NO downgrade de status)
  async upsertLead(params: {
    userId: string;
    targetId: string;
    originType: LeadOriginType;
    status: LeadStatus;
    lastTrigger: LeadTrigger;
    metadata?: any;
  }) {
    const { userId, targetId, originType, status, lastTrigger, metadata } = params;

    // Buscar existente
    const [existing] = await this.db
      .select()
      .from(leads)
      .where(
        and(
          eq(leads.userId, userId),
          eq(leads.targetId, targetId),
          eq(leads.originType, originType),
        ),
      );

    // 🔥 Crear si no existe
    if (!existing) {
      const [created] = await this.db
        .insert(leads)
        .values({
          userId,
          targetId,
          originType,
          status,
          lastTrigger,
          metadata,
        })
        .returning();

      return created;
    }

    // 🔥 Evitar downgrade de status
    const shouldUpdateStatus =
      this.statusPriority[status] > this.statusPriority[existing.status];

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

  // ✅ Obtener leads de un owner (escuela o curso)
  async getLeadsByOwner(
    ownerId: string,
    originType: LeadOriginType = 'SCHOOL',
  ) {
    return this.db
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
      .where(
        and(
          eq(leads.targetId, ownerId),
          eq(leads.originType, originType),
        ),
      )
      .orderBy(desc(leads.updatedAt));
  }

  // ✅ Update metadata
  async updateLeadMetadata(leadId: string, metadata: any) {
    const [updated] = await this.db
      .update(leads)
      .set({
        metadata,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return updated;
  }

  // ✅ Update status manual
  async updateLeadStatus(leadId: string, status: LeadStatus) {
    const [updated] = await this.db
      .update(leads)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(leads.id, leadId))
      .returning();

    return updated;
  }
}