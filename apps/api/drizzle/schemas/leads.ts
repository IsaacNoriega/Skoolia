import { pgEnum, pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const leadStatusEnum = pgEnum('lead_status', [
  'NUEVO',
  'INTERESADO',
  'VISITA',
  'INSCRITO',
]);

export const leadOriginTypeEnum = pgEnum('lead_origin_type', [
  'SCHOOL',
  'COURSE',
  'OTHER',
]);

export const leadTriggerEnum = pgEnum('lead_trigger', [
  'FAVORITE',
  'VIEW_MORE',
  'SCHEDULE_VISIT',
  'INFO_REQUEST',
  'CONTACT',
]);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  targetId: uuid('target_id').notNull(),
  originType: leadOriginTypeEnum('origin_type').notNull(),
  status: leadStatusEnum('status').notNull(),
  lastTrigger: leadTriggerEnum('last_trigger').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
