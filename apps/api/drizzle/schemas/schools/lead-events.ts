import { index, jsonb, pgEnum, pgTable, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { schools } from './school';

export const leadEventTypeEnum = pgEnum('lead_event_type', [
  'interest',
  'enrollment',
  'mass_message',
]);

export const leadEvents = pgTable(
  'lead_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull(),
    type: leadEventTypeEnum('type').notNull(),
    metadata: jsonb('metadata').notNull().default({}),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    schoolIdx: index('lead_events_school_idx').on(table.schoolId),
    userIdx: index('lead_events_user_idx').on(table.userId),
    typeIdx: index('lead_events_type_idx').on(table.type),
    uniqueUserSchoolType: uniqueIndex('lead_events_user_school_type_idx').on(table.userId, table.schoolId, table.type),
  })
);
