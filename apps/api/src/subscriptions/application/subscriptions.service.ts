import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte, inArray } from 'drizzle-orm';
import { plans, schoolSubscriptions, schools } from 'drizzle/schemas';

import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

export interface SchoolActivePlan {
  subscriptionId: string;
  schoolId: string;
  status: 'active' | 'past_due' | 'canceled';
  startDate: Date;
  endDate: Date;
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
}

export interface ChangePlanResult {
  message: string;
  subscription: SchoolActivePlan;
}

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getSchoolActivePlans(
    schoolId: string,
  ): Promise<SchoolActivePlan[]> {
    const now = new Date();

    const rows = await this.db
      .select({
        subscriptionId: schoolSubscriptions.id,
        schoolId: schoolSubscriptions.schoolId,
        status: schoolSubscriptions.status,
        startDate: schoolSubscriptions.startDate,
        endDate: schoolSubscriptions.endDate,
        planId: plans.id,
        planName: plans.name,
        planType: plans.type,
        planPrice: plans.price,
        planFeatures: plans.features,
      })
      .from(schoolSubscriptions)
      .innerJoin(plans, eq(plans.id, schoolSubscriptions.planId))
      .where(
        and(
          eq(schoolSubscriptions.schoolId, schoolId),
          eq(schoolSubscriptions.status, 'active'),
          gte(schoolSubscriptions.endDate, now),
        ),
      );

    return rows.map((row) => ({
      subscriptionId: row.subscriptionId,
      schoolId: row.schoolId,
      status: row.status as any,
      startDate: row.startDate,
      endDate: row.endDate,
      plan: {
        id: row.planId,
        name: row.planName,
        type: row.planType as any,
        price: row.planPrice,
        features: row.planFeatures,
      },
    }));
  }

  async getSchoolActivePlansByOwner(ownerId: string): Promise<SchoolActivePlan[]> {
    const rows = await this.db
      .select({ id: schools.id })
      .from(schools)
      .where(eq(schools.ownerId, ownerId))
      .limit(1);

    const school = rows[0];
    if (!school) {
      return [];
    }

    return this.getSchoolActivePlans(school.id);
  }

  async changePlan(ownerId: string, planId: string): Promise<ChangePlanResult> {
    const schoolId = await this.db.transaction(async (tx) => {
      let school = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.ownerId, ownerId))
        .then(rows => rows[0]);

      if (!school) {
        throw new NotFoundException('No se encontró una escuela asociada a este usuario. Los planes de escuela requieren una institución creada.');
      }

      const [targetPlan] = await tx
        .select({
          id: plans.id,
          name: plans.name,
          type: plans.type,
        })
        .from(plans)
        .where(eq(plans.id, planId))
        .limit(1);

      if (!targetPlan) {
        throw new NotFoundException('Plan not found');
      }

      // Definir la categoría del plan para saber qué reemplazar
      let planCategory: 'subscription' | 'lead_model' | 'addon';
      if (targetPlan.type === 'subscription') {
          planCategory = 'subscription';
      } else if (targetPlan.name.startsWith('LEAD_')) {
          planCategory = 'lead_model';
      } else {
          planCategory = 'addon'; // Ej: MASS_MESSAGE
      }

      const startDate = new Date();
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Buscamos planes activos que pertenezcan a la misma categoría
      const allActive = await tx
        .select({ 
          id: schoolSubscriptions.id,
          planName: plans.name,
          planType: plans.type
        })
        .from(schoolSubscriptions)
        .innerJoin(plans, eq(plans.id, schoolSubscriptions.planId))
        .where(and(
          eq(schoolSubscriptions.schoolId, school.id),
          eq(schoolSubscriptions.status, 'active')
        ));

      const existingInSameCategory = allActive.filter(s => {
          if (planCategory === 'subscription') return s.planType === 'subscription';
          if (planCategory === 'lead_model') return s.planName.startsWith('LEAD_');
          if (planCategory === 'addon') return !s.planName.startsWith('LEAD_') && s.planType !== 'subscription';
          return false;
      });

      if (existingInSameCategory.length > 0) {
        // Reemplazamos el primero que encontremos de esa categoría
        await tx
          .update(schoolSubscriptions)
          .set({
            planId: targetPlan.id,
            status: 'active',
            startDate,
            endDate,
            updatedAt: new Date(),
          })
          .where(eq(schoolSubscriptions.id, existingInSameCategory[0].id));
        
        // Si había más (limpieza), los cancelamos
        if (existingInSameCategory.length > 1) {
            const idsToCancel = existingInSameCategory.slice(1).map(s => s.id);
            await tx
                .update(schoolSubscriptions)
                .set({ status: 'canceled', updatedAt: new Date() })
                .where(inArray(schoolSubscriptions.id, idsToCancel));
        }
      } else {
        // Si no había nada en esa categoría, insertamos nuevo
        await tx.insert(schoolSubscriptions).values({
          schoolId: school.id,
          planId: targetPlan.id,
          status: 'active',
          startDate,
          endDate,
        });
      }

      return school.id;
    });

    const activePlans = await this.getSchoolActivePlans(schoolId);
    // Retornamos el plan que acabamos de activar para cumplir con el contrato de la interfaz anterior si es necesario
    const currentActivePlan = activePlans.find(p => p.plan.id === planId)!;

    return {
      message: 'Plan actualizado con éxito',
      subscription: currentActivePlan,
    };
  }
}
