import { relations } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { schoolSubscriptions } from './school-subscriptions';

export const planIntervalEnum = pgEnum('plan_interval', ['monthly', 'yearly']);

export type PlanFeatures = string[];

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),

    price: integer('price').notNull(),

    interval: planIntervalEnum('interval').notNull(),

    features: jsonb('features').$type<PlanFeatures>().notNull().default([]),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('plans_name_idx').on(table.name),
    intervalIdx: index('plans_interval_idx').on(table.interval),
  }),
);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(schoolSubscriptions),
}));
