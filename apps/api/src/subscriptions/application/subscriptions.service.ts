import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, gte } from 'drizzle-orm';
import { plans, schoolSubscriptions, schools } from 'drizzle/schemas';

import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

export interface SchoolActivePlan {
  subscriptionId: string;
  schoolId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: {
    id: string;
    name: string;
    price: number;
    interval: 'monthly' | 'yearly';
    features: string[];
  };
}

export interface UpgradeToPremiumResult {
  message: string;
  subscription: SchoolActivePlan;
}

@Injectable()
export class SubscriptionsService {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async getSchoolActivePlan(
    schoolId: string,
  ): Promise<SchoolActivePlan | null> {
    const now = new Date();

    const rows = await this.db
      .select({
        subscriptionId: schoolSubscriptions.id,
        schoolId: schoolSubscriptions.schoolId,
        status: schoolSubscriptions.status,
        currentPeriodStart: schoolSubscriptions.currentPeriodStart,
        currentPeriodEnd: schoolSubscriptions.currentPeriodEnd,
        planId: plans.id,
        planName: plans.name,
        planPrice: plans.price,
        planInterval: plans.interval,
        planFeatures: plans.features,
      })
      .from(schoolSubscriptions)
      .innerJoin(plans, eq(plans.id, schoolSubscriptions.planId))
      .where(
        and(
          eq(schoolSubscriptions.schoolId, schoolId),
          eq(schoolSubscriptions.status, 'active'),
          gte(schoolSubscriptions.currentPeriodEnd, now),
        ),
      )
      .limit(1);

    const row = rows[0];

    if (!row) {
      return null;
    }

    return {
      subscriptionId: row.subscriptionId,
      schoolId: row.schoolId,
      status: row.status,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      plan: {
        id: row.planId,
        name: row.planName,
        price: row.planPrice,
        interval: row.planInterval,
        features: row.planFeatures,
      },
    };
  }

  async upgradeToPremium(ownerId: string): Promise<UpgradeToPremiumResult> {
    const subscription = await this.db.transaction(async (tx) => {
      const [school] = await tx
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.ownerId, ownerId))
        .limit(1);

      if (!school) {
        throw new NotFoundException('School not found for this owner');
      }

      const [premiumPlan] = await tx
        .select({
          id: plans.id,
          interval: plans.interval,
        })
        .from(plans)
        .where(eq(plans.name, 'Premium'))
        .limit(1);

      if (!premiumPlan) {
        throw new NotFoundException('Premium plan not found');
      }

      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(currentPeriodStart);

      if (premiumPlan.interval === 'yearly') {
        currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
      } else {
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      }

      const [existingSubscription] = await tx
        .select({ id: schoolSubscriptions.id })
        .from(schoolSubscriptions)
        .where(eq(schoolSubscriptions.schoolId, school.id))
        .limit(1);

      if (existingSubscription) {
        await tx
          .update(schoolSubscriptions)
          .set({
            planId: premiumPlan.id,
            status: 'active',
            currentPeriodStart,
            currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(schoolSubscriptions.id, existingSubscription.id));
      } else {
        await tx.insert(schoolSubscriptions).values({
          schoolId: school.id,
          planId: premiumPlan.id,
          status: 'active',
          currentPeriodStart,
          currentPeriodEnd,
        });
      }

      return school.id;
    });

    const activePlan = await this.getSchoolActivePlan(subscription);

    if (!activePlan) {
      throw new NotFoundException('Updated subscription could not be loaded');
    }

    return {
      message: 'School upgraded to Premium successfully',
      subscription: activePlan,
    };
  }
}
