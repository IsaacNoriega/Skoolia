import { Inject, Injectable } from '@nestjs/common';
import {
  plans,
  schoolCategories,
  schoolSubscriptions,
  schools,
} from 'drizzle/schemas';
import { and, eq, ilike, desc, lt, SQL, or, gte, lte, sql } from 'drizzle-orm';

import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

import type { SchoolRepository } from '../../core/ports/school.repository';
import { School } from 'src/schools/core/entities/school.types';
import {
  SchoolEdge,
  SchoolsConnection,
} from 'src/schools/core/entities/schools-connection';
import { files } from 'drizzle/schemas';
import { alias } from 'drizzle-orm/pg-core';

function encodeCursor(date: Date): string {
  return Buffer.from(date.toISOString()).toString('base64');
}

function decodeCursor(cursor: string): Date {
  const decoded = Buffer.from(cursor, 'base64').toString('ascii');
  return new Date(decoded);
}

@Injectable()
export class DrizzleSchoolRepository implements SchoolRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async create(params: {
    name: string;
    description?: string;
    ownerId: string;
    latitude?: number;
    longitude?: number;
  }) {
    return this.db.transaction(async (tx) => {
      const now = new Date();

      const [freemiumPlan] = await tx
        .select({
          id: plans.id,
        })
        .from(plans)
        .where(eq(plans.name, 'FREEMIUM'))
        .limit(1);

      if (!freemiumPlan) {
        throw new Error('Freemium plan not found');
      }

      const [school] = await tx
        .insert(schools)
        .values({
          name: params.name,
          description: params.description,
          ownerId: params.ownerId,
          latitude: params.latitude,
          longitude: params.longitude,
        })
        .returning();

      const endDate = new Date(now);
      // Freemium se asigna por 1 año por defecto
      endDate.setFullYear(endDate.getFullYear() + 1);

      await tx.insert(schoolSubscriptions).values({
        schoolId: school.id,
        planId: freemiumPlan.id,
        status: 'active',
        startDate: now,
        endDate: endDate,
      });

      return school;
    });
  }

  async findByOwner(ownerId: string): Promise<School | null> {
    const logoFile = alias(files, 'logo_file');
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: schools.id,
        name: schools.name,
        description: schools.description,

        logoUrl: logoFile.url,
        coverImageUrl: coverFile.url,

        address: schools.address,
        city: schools.city,
        state: schools.state,
        latitude: schools.latitude,
        longitude: schools.longitude,

        educationalLevel: schools.educationalLevel,
        institutionType: schools.institutionType,
        schedule: schools.schedule,
        languages: schools.languages,
        maxStudentsPerClass: schools.maxStudentsPerClass,
        enrollmentYear: schools.enrollmentYear,
        enrollmentOpen: schools.enrollmentOpen,
        monthlyPrice: schools.monthlyPrice,

        averageRating: schools.averageRating,
        ratingsCount: schools.ratingsCount,
        favoritesCount: schools.favoritesCount,
        rankingScore: schools.rankingScore,

        isFeatured: schools.isFeatured,
        isVerified: schools.isVerified,

        ownerId: schools.ownerId,
        createdAt: schools.createdAt,
        updatedAt: schools.updatedAt,
      })
      .from(schools)
      .leftJoin(logoFile, eq(logoFile.id, schools.logoUrl))
      .leftJoin(coverFile, eq(coverFile.id, schools.coverImageUrl))
      .where(eq(schools.ownerId, ownerId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findById(id: string): Promise<School | null> {
    const logoFile = alias(files, 'logo_file');
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: schools.id,
        name: schools.name,
        description: schools.description,

        logoUrl: logoFile.url,
        coverImageUrl: coverFile.url,

        address: schools.address,
        city: schools.city,
        state: schools.state,
        latitude: schools.latitude,
        longitude: schools.longitude,

        educationalLevel: schools.educationalLevel,
        institutionType: schools.institutionType,
        schedule: schools.schedule,
        languages: schools.languages,
        maxStudentsPerClass: schools.maxStudentsPerClass,
        enrollmentYear: schools.enrollmentYear,
        enrollmentOpen: schools.enrollmentOpen,
        monthlyPrice: schools.monthlyPrice,

        averageRating: schools.averageRating,
        ratingsCount: schools.ratingsCount,
        favoritesCount: schools.favoritesCount,
        rankingScore: schools.rankingScore,

        isFeatured: schools.isFeatured,
        isVerified: schools.isVerified,

        ownerId: schools.ownerId,
        createdAt: schools.createdAt,
        updatedAt: schools.updatedAt,
      })
      .from(schools)
      .leftJoin(logoFile, eq(logoFile.id, schools.logoUrl))
      .leftJoin(coverFile, eq(coverFile.id, schools.coverImageUrl))
      .where(eq(schools.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async list() {
    return this.db.select().from(schools);
  }

  async update(params: { ownerId: string; data: Partial<School> }) {
    const [updated] = await this.db
      .update(schools)
      .set({
        ...params.data,
        updatedAt: new Date(),
      })
      .where(eq(schools.ownerId, params.ownerId))
      .returning();

    return updated;
  }

  async assignCategories(
    schoolId: string,
    categoryIds: string[],
  ): Promise<void> {
    // borrar actuales
    await this.db
      .delete(schoolCategories)
      .where(eq(schoolCategories.schoolId, schoolId));

    if (!categoryIds.length) return;

    await this.db.insert(schoolCategories).values(
      categoryIds.map((categoryId) => ({
        schoolId,
        categoryId,
      })),
    );
  }

  async listForFeed(params: {
    filters?: {
      educationalLevel?: string;
      city?: string;
      state?: string;
      categoryId?: string;
      schedule?: string;
      languages?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      sortBy?: 'favorites' | 'rating' | 'recent';
      onlyVerified?: boolean;
      latitude?: number;
      longitude?: number;
    };
    pagination?: {
      first: number;
      after?: string;
    };
  }): Promise<SchoolsConnection> {
    const { filters = {}, pagination } = params;

    const whereConditions: SQL[] = [];

    // Si llegan lat/lng, filtrar por cercanía (10km)
    if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
      // Haversine formula en SQL (Postgres)
      const earthRadiusKm = 6371;
      const radiusKm = 10;
      whereConditions.push(
        sql`(
          ${earthRadiusKm} * acos(
            cos(radians(${filters.latitude})) * cos(radians(${schools.latitude})) *
            cos(radians(${schools.longitude}) - radians(${filters.longitude})) +
            sin(radians(${filters.latitude})) * sin(radians(${schools.latitude}))
          )
        ) <= ${radiusKm}`
      );
    }

    if (filters.educationalLevel) {
      whereConditions.push(
        ilike(schools.educationalLevel, `%${filters.educationalLevel}%`),
      );
    }


    if (filters.city) {
      whereConditions.push(ilike(schools.city, `%${filters.city}%`));
    }

    if (filters.state) {
      whereConditions.push(ilike(schools.state, `%${filters.state}%`));
    }

    if (filters.categoryId) {
      whereConditions.push(eq(schoolCategories.categoryId, filters.categoryId));
    }

    if (filters.schedule) {
      whereConditions.push(ilike(schools.schedule, `%${filters.schedule}%`));
    }

    if (filters.languages) {
      whereConditions.push(ilike(schools.languages, `%${filters.languages}%`));
    }

    if (typeof filters.minPrice === 'number') {
      whereConditions.push(gte(schools.monthlyPrice, filters.minPrice));
    }

    if (typeof filters.maxPrice === 'number') {
      whereConditions.push(lte(schools.monthlyPrice, filters.maxPrice));
    }

    if (filters.onlyVerified) {
      whereConditions.push(eq(schools.isVerified, true));
    }

    if (filters.search) {
      whereConditions.push(
        or(
          ilike(schools.name, `%${filters.search}%`),
          ilike(schools.educationalLevel, `%${filters.search}%`),
        )!,
      );
    }

    if (pagination?.after) {
      const cursorDate = decodeCursor(pagination.after);
      whereConditions.push(lt(schools.createdAt, cursorDate));
    }

    // Priorización por plan: PREMIUM_SUBSCRIPTION primero
    const logoFile = alias(files, 'logo_file');
    const coverFile = alias(files, 'cover_file');
    const sub = alias(schoolSubscriptions, 'sub');
    const plan = alias(plans, 'plan');

    // plan_priority: 2 = PREMIUM_SUBSCRIPTION, 1 = otros
    const queryBuilder = this.db.select({
      id: schools.id,
      name: schools.name,
      description: schools.description,
      logoUrl: logoFile.url,
      coverImageUrl: coverFile.url,
      address: schools.address,
      city: schools.city,
      state: schools.state,
      latitude: schools.latitude,
      longitude: schools.longitude,
      educationalLevel: schools.educationalLevel,
      institutionType: schools.institutionType,
      schedule: schools.schedule,
      languages: schools.languages,
      maxStudentsPerClass: schools.maxStudentsPerClass,
      enrollmentYear: schools.enrollmentYear,
      enrollmentOpen: schools.enrollmentOpen,
      monthlyPrice: schools.monthlyPrice,
      averageRating: schools.averageRating,
      ratingsCount: schools.ratingsCount,
      favoritesCount: schools.favoritesCount,
      rankingScore: schools.rankingScore,
      isFeatured: schools.isFeatured,
      isVerified: schools.isVerified,
      ownerId: schools.ownerId,
      createdAt: schools.createdAt,
      updatedAt: schools.updatedAt,
      planName: plan.name,
      planPriority: sql`CASE WHEN plan.name = 'PREMIUM_SUBSCRIPTION' THEN 2 ELSE 1 END`,
    });

    const fromBuilder = filters.categoryId
      ? queryBuilder
          .from(schools)
          .leftJoin(logoFile, eq(logoFile.id, schools.logoUrl))
          .leftJoin(coverFile, eq(coverFile.id, schools.coverImageUrl))
          .innerJoin(sub, eq(sub.schoolId, schools.id))
          .innerJoin(plan, eq(plan.id, sub.planId))
          .innerJoin(
            schoolCategories,
            eq(schoolCategories.schoolId, schools.id),
          )
      : queryBuilder
          .from(schools)
          .leftJoin(logoFile, eq(logoFile.id, schools.logoUrl))
          .leftJoin(coverFile, eq(coverFile.id, schools.coverImageUrl))
          .innerJoin(sub, eq(sub.schoolId, schools.id))
          .innerJoin(plan, eq(plan.id, sub.planId));

    // Solo suscripción activa
    whereConditions.push(eq(sub.status, 'active'));
    whereConditions.push(sql`${sub.startDate} <= now()`);
    whereConditions.push(sql`${sub.endDate} >= now()`);

    const whereBuilder =
      whereConditions.length > 0
        ? fromBuilder.where(and(...whereConditions))
        : fromBuilder;

    // Priorización: PREMIUM primero, luego por fecha
    const orderedBuilder = whereBuilder.orderBy(
      desc(sql`CASE WHEN plan.name = 'PREMIUM_SUBSCRIPTION' THEN 2 ELSE 1 END`),
      desc(schools.createdAt)
    );

    const limit = pagination?.first ?? 10;

    const rows = await orderedBuilder.limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const sliced = hasNextPage ? rows.slice(0, limit) : rows;

    const edges: SchoolEdge[] = sliced.map((row) => ({
      node: row,
      cursor: encodeCursor(row.createdAt),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage,
        endCursor:
          sliced.length > 0
            ? encodeCursor(sliced[sliced.length - 1].createdAt)
            : null,
      },
    };
  }

  async findRawByOwner(ownerId: string): Promise<{
    id: string;
    logoFileId: string | null;
    coverImageFileId: string | null;
  } | null> {
    const rows = await this.db
      .select({
        id: schools.id,
        logoFileId: schools.logoUrl, // 👈 UUID real
        coverImageFileId: schools.coverImageUrl, // 👈 UUID real
      })
      .from(schools)
      .where(eq(schools.ownerId, ownerId))
      .limit(1);

    return rows[0] ?? null;
  }

  async updateImageAtomic(params: {
    ownerId: string;
    field: 'logoUrl' | 'coverImageUrl';
    newFileId: string;
  }): Promise<{ oldFileId: string | null }> {
    return this.db.transaction(async (tx) => {
      const row = await tx
        .select({
          logoUrl: schools.logoUrl,
          coverImageUrl: schools.coverImageUrl,
        })
        .from(schools)
        .where(eq(schools.ownerId, params.ownerId))
        .limit(1);

      if (!row[0]) {
        throw new Error('School not found');
      }

      const oldFileId =
        params.field === 'logoUrl' ? row[0].logoUrl : row[0].coverImageUrl;

      await tx
        .update(schools)
        .set({
          [params.field]: params.newFileId,
          updatedAt: new Date(),
        })
        .where(eq(schools.ownerId, params.ownerId));

      return { oldFileId };
    });
  }

  async findNearby(lat: number, lng: number, radius: number) {
    // Validación de coordenadas
    if (lat == null || lng == null) {
      return [];
    }
    // Radio por defecto (km)
    const effectiveRadius = radius ?? 50;
    // Haversine formula en SQL (distancia en km)
    const distanceSql = sql`
      6371 * acos(
        cos(radians(${lat})) * cos(radians(${schools.lat})) * cos(radians(${schools.lng}) - radians(${lng}))
        + sin(radians(${lat})) * sin(radians(${schools.lat}))
      )
    `;

    const rows = await this.db
      .select({
        school: {
          id: schools.id,
          name: schools.name,
          description: schools.description,
          address: schools.address,
          city: schools.city,
          state: schools.state,
          lat: schools.latitude ?? schools.lat,
          lng: schools.longitude ?? schools.lng,
          educationalLevel: schools.educationalLevel,
          institutionType: schools.institutionType,
          schedule: schools.schedule,
          languages: schools.languages,
          maxStudentsPerClass: schools.maxStudentsPerClass,
          enrollmentYear: schools.enrollmentYear,
          enrollmentOpen: schools.enrollmentOpen,
          monthlyPrice: schools.monthlyPrice,
          averageRating: schools.averageRating,
          ratingsCount: schools.ratingsCount,
          favoritesCount: schools.favoritesCount,
          rankingScore: schools.rankingScore,
          isFeatured: schools.isFeatured,
          isVerified: schools.isVerified,
          ownerId: schools.ownerId,
          createdAt: schools.createdAt,
          updatedAt: schools.updatedAt,
        },
        distance: distanceSql,
      })
      .from(schools)
      .where(sql`${distanceSql} <= ${effectiveRadius}`)
      .orderBy(sql`distance`);

    return rows;
  }
}
