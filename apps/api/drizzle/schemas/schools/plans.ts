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

export const planNameEnum = pgEnum('plan_name', [
  'FREEMIUM',
  'PREMIUM_SUBSCRIPTION',
  'LEAD_INTEREST',
  'LEAD_ENROLLMENT',
  'MASS_MESSAGE',
]);

export const planTypeEnum = pgEnum('plan_type', ['subscription', 'lead']);
export const planPricingModelEnum = pgEnum('plan_pricing_model', ['recurrent', 'variable', 'per_event']);

export type PlanFeatures = string[];

export const plans = pgTable(
  'plans',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: planNameEnum('name').notNull(),
    type: planTypeEnum('type').notNull(),
    pricingModel: planPricingModelEnum('pricing_model').notNull(),
    price: integer('price').notNull().default(0),
    isActive: integer('is_active').notNull().default(1),

    features: jsonb('features').$type<PlanFeatures>().notNull().default([]),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index('plans_name_idx').on(table.name),
    typeIdx: index('plans_type_idx').on(table.type),
    pricingModelIdx: index('plans_pricing_model_idx').on(table.pricingModel),
    isActiveIdx: index('plans_is_active_idx').on(table.isActive),
  }),
);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(schoolSubscriptions),
}));
