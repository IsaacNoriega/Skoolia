import { relations } from 'drizzle-orm';
import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  doublePrecision,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';
import { privateUsers } from '../users/private-users';
import { files } from '../files';
import { schoolSubscriptions } from './school-subscriptions';

export const schools = pgTable(
  'schools',
  {
    id: uuid('id').defaultRandom().primaryKey(),

    name: text('name').notNull(),
    description: text('description'),

    // 🖼 imágenes
    logoUrl: uuid('logo_url').references(() => files.id, {
      onDelete: 'set null',
    }),
    coverImageUrl: uuid('cover_image_url').references(() => files.id, {
      onDelete: 'set null',
    }),

    // 📍 ubicación
    address: text('address'),
    city: text('city'),
    latitude: doublePrecision('latitude'),
    longitude: doublePrecision('longitude'),
    lat: doublePrecision('lat'), // Nueva columna para geolocalización
    lng: doublePrecision('lng'), // Nueva columna para geolocalización

    // 🎓 info académica
    educationalLevel: text('educational_level'),
    institutionType: text('institution_type'), // publica | privada
    schedule: text('schedule'),
    maxStudentsPerClass: integer('max_students_per_class'),
    languages: text('languages'),
    enrollmentYear: integer('enrollment_year'),
    enrollmentOpen: boolean('enrollment_open').default(false),

    // 💰 precios
    monthlyPrice: integer('monthly_price'),

    // ⭐ métricas
    averageRating: doublePrecision('average_rating').default(0).notNull(),
    ratingsCount: integer('ratings_count').default(0).notNull(),
    favoritesCount: integer('favorites_count').default(0).notNull(),
    rankingScore: doublePrecision('ranking_score').default(0).notNull(),

    // 🏅 destacados
    isFeatured: boolean('is_featured').default(false).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),

    // 🔐 owner
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => privateUsers.id, {
        onDelete: 'cascade',
      }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    ownerUnique: uniqueIndex('schools_owner_unique').on(table.ownerId),
    ownerIdx: index('schools_owner_idx').on(table.ownerId),
    nameIdx: index('schools_name_idx').on(table.name),
    cityIdx: index('schools_city_idx').on(table.city),
    ratingIdx: index('schools_rating_idx').on(table.averageRating),
    verifiedIdx: index('schools_verified_idx').on(table.isVerified),
  }),
);

export const schoolsRelations = relations(schools, ({ one }) => ({
  owner: one(privateUsers, {
    fields: [schools.ownerId],
    references: [privateUsers.id],
  }),
  subscription: one(schoolSubscriptions, {
    fields: [schools.id],
    references: [schoolSubscriptions.schoolId],
  }),
}));
