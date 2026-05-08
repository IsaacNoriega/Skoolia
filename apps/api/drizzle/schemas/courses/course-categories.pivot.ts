import { pgTable, uuid, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { courses } from './courses';
import { categories } from '../schools/school-categories';

export const courseCategories = pgTable(
  'course_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),

    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => ({
    uniqueRelation: uniqueIndex('course_categories_unique').on(
      table.courseId,
      table.categoryId,
    ),
    courseIdx: index('course_categories_course_idx').on(table.courseId),
    categoryIdx: index('course_categories_category_idx').on(table.categoryId),
  }),
);
