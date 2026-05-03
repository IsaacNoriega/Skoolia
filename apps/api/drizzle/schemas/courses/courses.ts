import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  doublePrecision,
  index,
  pgEnum,
  jsonb,
} from 'drizzle-orm/pg-core';

import { schools } from '../schools/school';
import { files } from '../files';

/**
 * ENUM → Course status
 */
export const courseStatusEnum = pgEnum('course_status', [
  'draft',
  'published',
  'archived',
]);

export const courses = pgTable(
  'courses',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    schoolId: uuid('school_id').references(() => schools.id, {
      onDelete: 'cascade',
    }),

    // Nuevo: ownerId (nullable para migración)
    ownerId: uuid('owner_id'),

    name: text('name').notNull(),

    description: text('description'),

    coverImageUrl: text('cover_image_url'),
    gallery: jsonb('gallery').$type<string[]>().default([]),

    // 💰 pricing
    price: integer('price'),

    // 👥 capacity
    capacity: integer('capacity'),

    // 📅 scheduling
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    // schoolId definido arriba
    // 🌐 modalidad
    modality: text('modality'), // presencial | online | híbrido

    // Ubicación (opcional, solo si modality es presencial o híbrido)
    address: text('address'),
    city: text('city'),
    state: text('state'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),


    averageRating: doublePrecision('average_rating').default(0).notNull(),

    favoritesCount: integer('favorites_count').default(0).notNull(),

    enrollmentsCount: integer('enrollments_count').default(0).notNull(),

    // 🔄 estado
    status: courseStatusEnum('status').default('draft').notNull(),

    isActive: boolean('is_active').default(true).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    schoolIdx: index('courses_school_idx').on(table.schoolId),
    ownerIdx: index('courses_owner_idx').on(table.ownerId),
    statusIdx: index('courses_status_idx').on(table.status),
    activeIdx: index('courses_active_idx').on(table.isActive),
    ratingIdx: index('courses_rating_idx').on(table.averageRating),
  }),
);
