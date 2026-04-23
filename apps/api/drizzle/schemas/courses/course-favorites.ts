import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { publicUsers } from '../users/public-users';
import { courses } from './courses';

/**
 * Course favorites
 * - Public users pueden guardar cursos
 */
export const courseFavorites = pgTable(
  'course_favorites',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    publicUserId: uuid('public_user_id')
      .notNull()
      .references(() => publicUsers.id, {
        onDelete: 'cascade',
      }),

    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    /**
     * 🔒 Un usuario no puede guardar el mismo curso 2 veces
     */
    uniqueFavorite: uniqueIndex('course_favorites_unique').on(
      table.publicUserId,
      table.courseId,
    ),

    /**
     * 🔍 performance
     */
    userIdx: index('course_favorites_user_idx').on(table.publicUserId),

    courseIdx: index('course_favorites_course_idx').on(table.courseId),
  }),
);
