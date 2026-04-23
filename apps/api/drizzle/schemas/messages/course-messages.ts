import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { courses } from '../courses/courses';
import { publicUsers } from '../users';

export const courseMessages = pgTable(
  'course_messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, { onDelete: 'cascade' }),
    senderRole: text('sender_role').$type<'public' | 'private'>().notNull(),
    content: text('content').notNull(),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    courseIdx: index('course_messages_course_idx').on(table.courseId),
    publicUserIdx: index('course_messages_public_user_idx').on(table.publicUserId),
    threadIdx: index('course_messages_thread_idx').on(
      table.courseId,
      table.publicUserId,
      table.createdAt,
    ),
  }),
);
