import { relations } from 'drizzle-orm';
import {
  index,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { plans } from '../schools/plans';
import { courses } from './courses';

export const courseSubscriptionStatusEnum = pgEnum('course_subscription_status', [
  'active',
  'past_due',
  'canceled',
]);

export const courseSubscriptions = pgTable(
  'course_subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, {
        onDelete: 'cascade',
      }),

    planId: uuid('plan_id')
      .notNull()
      .references(() => plans.id, {
        onDelete: 'restrict',
      }),

    status: courseSubscriptionStatusEnum('status').notNull().default('active'),

    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    courseUnique: uniqueIndex('course_subscriptions_course_unique').on(
      table.courseId,
    ),
    courseIdx: index('course_subscriptions_course_idx').on(table.courseId),
    planIdx: index('course_subscriptions_plan_idx').on(table.planId),
    statusIdx: index('course_subscriptions_status_idx').on(table.status),
  }),
);

export const courseSubscriptionsRelations = relations(
  courseSubscriptions,
  ({ one }) => ({
    course: one(courses, {
      fields: [courseSubscriptions.courseId],
      references: [courses.id],
    }),
    plan: one(plans, {
      fields: [courseSubscriptions.planId],
      references: [plans.id],
    }),
  }),
);
