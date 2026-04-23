import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { leadEvents, plans, schoolSubscriptions } from 'drizzle/schemas';
import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

@Injectable()
export class LeadEventsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  // 🔍 Analytics - Obtener eventos por escuela
  async getEventsBySchool(schoolId: string) {
    return this.db
      .select()
      .from(leadEvents)
      .where(eq(leadEvents.schoolId, schoolId));
  }

  // 🎯 INTERÉS - Crear evento de interés
  async createInterestEvent(params: {
    schoolId: string;
    userId: string;
    action: 'contact_click' | 'info_request' | 'visit_scheduled';
    metadata?: Record<string, any>;
  }) {
    return this.db.insert(leadEvents).values({
      schoolId: params.schoolId,
      userId: params.userId,
      type: 'interest',
      metadata: {
        action: params.action,
        ...params.metadata,
      },
    }).onConflictDoNothing();
  }

  // 💰 INSCRIPCIÓN - Crear evento de inscripción
  async createEnrollmentEvent(params: {
    schoolId: string;
    userId: string;
    enrollmentAmount: number;
    metadata?: Record<string, any>;
  }) {
    // 1. Obtener el plan activo de la escuela para calcular la comisión
    const activeSub = await this.db.select({
      price: plans.price,
      pricingModel: plans.pricingModel,
    })
    .from(schoolSubscriptions)
    .innerJoin(plans, eq(plans.id, schoolSubscriptions.planId))
    .where(
      and(
        eq(schoolSubscriptions.schoolId, params.schoolId),
        eq(schoolSubscriptions.status, 'active'),
        sql`${schoolSubscriptions.startDate} <= now()`,
        sql`${schoolSubscriptions.endDate} >= now()`
      )
    )
    .limit(1);

    let commission = params.enrollmentAmount * 0.01; // fallback
    if (activeSub.length > 0) {
      const plan = activeSub[0];
      if (plan.pricingModel === 'variable') {
        // Asumiendo que price es el porcentaje (ej. 5 = 5%)
        commission = params.enrollmentAmount * (plan.price / 100);
      } else if (plan.pricingModel === 'per_event') {
        commission = plan.price; // precio fijo por evento
      }
    }

    return this.db.insert(leadEvents).values({
      schoolId: params.schoolId,
      userId: params.userId,
      type: 'enrollment',
      metadata: {
        enrollmentAmount: params.enrollmentAmount,
        commission,
        ...params.metadata,
      },
    }).onConflictDoNothing();
  }

  // 📢 MENSAJE MASIVO - Crear evento de campaña
  async createMassMessageEvent(params: {
    schoolId: string;
    userId: string;
    campaignId: string;
    usersReached: string[];
    metadata?: Record<string, any>;
  }) {
    return this.db.insert(leadEvents).values({
      schoolId: params.schoolId,
      userId: params.userId,
      type: 'mass_message',
      metadata: {
        campaignId: params.campaignId,
        usersReached: params.usersReached.length,
        ...params.metadata,
      },
    }).onConflictDoNothing();
  }
}
