import {
  pgTable,
  uuid,
  integer,
  text,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { courses } from './courses';
import { publicUsers } from '../users/public-users';

export const courseRatings = pgTable(
  'course_ratings',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),

    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, { onDelete: 'cascade' }),

    rating: integer('rating').notNull(), // 1–5

    comment: text('comment'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    uniqueUserRating: uniqueIndex('course_rating_unique').on(
      table.courseId,
      table.publicUserId,
    ),
    courseIdx: index('course_ratings_course_idx').on(table.courseId),
  }),
);
