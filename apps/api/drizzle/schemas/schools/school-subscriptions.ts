import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { plans } from './plans';
import { schools } from './school';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'pending',
]);

export const schoolSubscriptions = pgTable(
  'school_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, {
        onDelete: 'cascade',
      }),

    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, {
        onDelete: 'restrict',
      }),

    status: subscriptionStatusEnum('status').notNull().default('active'),

    startDate: timestamp('start_date').notNull(),
    endDate: timestamp('end_date').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    schoolUnique: uniqueIndex('school_subscriptions_school_unique').on(
      table.schoolId,
    ),
    schoolIdx: index('school_subscriptions_school_idx').on(table.schoolId),
    planIdx: index('school_subscriptions_plan_idx').on(table.planId),
    statusIdx: index('school_subscriptions_status_idx').on(table.status),
  }),
);

export const schoolSubscriptionsRelations = relations(
  schoolSubscriptions,
  ({ one }) => ({
    school: one(schools, {
      fields: [schoolSubscriptions.schoolId],
      references: [schools.id],
    }),
    plan: one(plans, {
      fields: [schoolSubscriptions.planId],
      references: [plans.id],
    }),
  }),
);
