import { courseSubscriptions } from 'drizzle/schemas/courses';
import { plans } from 'drizzle/schemas/schools/plans';
import { Inject, Injectable } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import { courses } from 'drizzle/schemas/courses/courses';
import { CourseRepository } from 'src/courses/core/ports/course.repository';
import { Course } from 'src/courses/core/entities/course.types';
import { DATABASE } from 'src/db/db.module';
import * as dbTypes from 'src/db/db.types';
import { files, schools, privateUsers, courseCategories, categories } from 'drizzle/schemas';
import { alias } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

@Injectable()
export class DrizzleCourseRepository implements CourseRepository {
  constructor(@Inject(DATABASE) private readonly db: dbTypes.Database) {}

  async getActiveSubscription(courseId: string) {
    const now = new Date();

    const [row] = await this.db
      .select({
        subscriptionId: courseSubscriptions.id,
        courseId: courseSubscriptions.courseId,
        status: courseSubscriptions.status,
        currentPeriodStart: courseSubscriptions.currentPeriodStart,
        currentPeriodEnd: courseSubscriptions.currentPeriodEnd,
        planId: plans.id,
        planName: plans.name,
        planPrice: plans.price,
        planFeatures: plans.features,
      })
      .from(courseSubscriptions)
      .innerJoin(plans, eq(plans.id, courseSubscriptions.planId))
      .where(
        and(
          eq(courseSubscriptions.courseId, courseId),
          eq(courseSubscriptions.status, 'active'),
          gte(courseSubscriptions.currentPeriodEnd, now),
        ),
      )
      .limit(1);

    if (!row) return null;

    return {
      subscriptionId: row.subscriptionId,
      courseId: row.courseId,
      status: row.status,
      currentPeriodStart: row.currentPeriodStart,
      currentPeriodEnd: row.currentPeriodEnd,
      plan: {
        id: row.planId,
        name: row.planName,
        price: row.planPrice,
        features: row.planFeatures,
      },
    };
  }

  async create(params: {
    schoolId?: string | null;
    ownerId: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    price: number | null;
    capacity?: number;
    startDate?: Date;
    endDate?: Date;
    modality?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    gallery?: string[];
    onlineInstructions?: string;
    categoryIds?: string[];
  }): Promise<Course> {
    const [course] = await this.db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(courses)
        .values({
          schoolId: params.schoolId ?? null,
          ownerId: params.ownerId,
          name: params.name,
          description: params.description ?? null,
          coverImageUrl: params.coverImageUrl ?? null,
          price: params.price ?? null,
          capacity: params.capacity ?? null,
          startDate: params.startDate ?? null,
          endDate: params.endDate ?? null,
          modality: params.modality ?? null,
          address: params.address ?? null,
          city: params.city ?? null,
          state: params.state ?? null,
          latitude: params.latitude ?? null,
          longitude: params.longitude ?? null,
          gallery: params.gallery ?? [],
          onlineInstructions: params.onlineInstructions ?? null,
        })
        .returning();

      if (params.categoryIds?.length) {
        await tx.insert(courseCategories).values(
          params.categoryIds.map((cid) => ({
            courseId: inserted.id,
            categoryId: cid,
          })),
        );
      }

      return [inserted];
    });

    return { ...course, ownerId: course.ownerId ?? '' };
  }

  async findById(id: string): Promise<Course | null> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
        ownerId: courses.ownerId,
        name: courses.name,
        description: courses.description,
        coverImageUrl: sql<string>`COALESCE(${coverFile.url}, ${courses.coverImageUrl})`,
        gallery: courses.gallery,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
        address: courses.address,
        city: courses.city,
        state: courses.state,
        latitude: courses.latitude,
        longitude: courses.longitude,
        onlineInstructions: courses.onlineInstructions,
        averageRating: courses.averageRating,
        enrollmentsCount: courses.enrollmentsCount,
        status: courses.status,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        schoolName: schools.name,
        ownerName: privateUsers.name,
      })
      .from(courses)
      .leftJoin(coverFile, eq(sql`${coverFile.id}::text`, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(eq(courses.id, id))
      .limit(1);

    if (!rows.length) return null;

    const courseData = rows[0];

    // Fetch categories
    const categoryRows = await this.db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(courseCategories)
      .innerJoin(categories, eq(categories.id, courseCategories.categoryId))
      .where(eq(courseCategories.courseId, id));

    const course = { 
      ...courseData, 
      ownerId: courseData.ownerId ?? '',
      categories: categoryRows 
    };
    const subscription = await this.getActiveSubscription(id);

    return { ...course, subscription };
  }

  async findByOwner(ownerId: string): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
        ownerId: courses.ownerId,
        name: courses.name,
        description: courses.description,
        coverImageUrl: sql<string>`COALESCE(${coverFile.url}, ${courses.coverImageUrl})`,
        gallery: courses.gallery,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
        address: courses.address,
        city: courses.city,
        state: courses.state,
        latitude: courses.latitude,
        longitude: courses.longitude,
        onlineInstructions: courses.onlineInstructions,
        averageRating: courses.averageRating,
        enrollmentsCount: courses.enrollmentsCount,
        status: courses.status,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        schoolName: schools.name,
        ownerName: privateUsers.name,
      })
      .from(courses)
      .leftJoin(coverFile, eq(sql`${coverFile.id}::text`, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(eq(courses.ownerId, ownerId));

    const courseList = rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
    
    if (!courseList.length) return [];

    const courseIds = courseList.map(c => c.id);
    const categoryRows = await this.db
      .select({
        courseId: courseCategories.courseId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(courseCategories)
      .innerJoin(categories, eq(categories.id, courseCategories.categoryId))
      .where(sql`${courseCategories.courseId} IN ${courseIds}`);

    return courseList.map(c => ({
      ...c,
      categories: categoryRows.filter(cat => cat.courseId === c.id)
    }));
  }

  async findPublicBySchoolId(schoolId: string): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
        ownerId: courses.ownerId,
        name: courses.name,
        description: courses.description,
        coverImageUrl: sql<string>`COALESCE(${coverFile.url}, ${courses.coverImageUrl})`,
        gallery: courses.gallery,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
        address: courses.address,
        city: courses.city,
        state: courses.state,
        latitude: courses.latitude,
        longitude: courses.longitude,
        onlineInstructions: courses.onlineInstructions,
        averageRating: courses.averageRating,
        enrollmentsCount: courses.enrollmentsCount,
        status: courses.status,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        schoolName: schools.name,
        ownerName: privateUsers.name,
      })
      .from(courses)
      .leftJoin(coverFile, eq(sql`${coverFile.id}::text`, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(and(eq(courses.schoolId, schoolId), eq(courses.isActive, true), eq(courses.status, 'published')));

    const courseList = rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
    
    if (!courseList.length) return [];

    const courseIds = courseList.map(c => c.id);
    const categoryRows = await this.db
      .select({
        courseId: courseCategories.courseId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(courseCategories)
      .innerJoin(categories, eq(categories.id, courseCategories.categoryId))
      .where(sql`${courseCategories.courseId} IN ${courseIds}`);

    return courseList.map(c => ({
      ...c,
      categories: categoryRows.filter(cat => cat.courseId === c.id)
    }));
  }

  async findAllPublic(): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
        ownerId: courses.ownerId,
        name: courses.name,
        description: courses.description,
        coverImageUrl: sql<string>`COALESCE(${coverFile.url}, ${courses.coverImageUrl})`,
        gallery: courses.gallery,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
        address: courses.address,
        city: courses.city,
        state: courses.state,
        latitude: courses.latitude,
        longitude: courses.longitude,
        onlineInstructions: courses.onlineInstructions,
        averageRating: courses.averageRating,
        enrollmentsCount: courses.enrollmentsCount,
        status: courses.status,
        isActive: courses.isActive,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
        schoolName: schools.name,
        ownerName: privateUsers.name,
      })
      .from(courses)
      .leftJoin(coverFile, eq(sql`${coverFile.id}::text`, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(and(eq(courses.isActive, true), eq(courses.status, 'published')));

    const courseList = rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
    
    if (!courseList.length) return [];

    const courseIds = courseList.map(c => c.id);
    const categoryRows = await this.db
      .select({
        courseId: courseCategories.courseId,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(courseCategories)
      .innerJoin(categories, eq(categories.id, courseCategories.categoryId))
      .where(sql`${courseCategories.courseId} IN ${courseIds}`);

    return courseList.map(c => ({
      ...c,
      categories: categoryRows.filter(cat => cat.courseId === c.id)
    }));
  }

  async update(params: { courseId: string; data: Partial<Course & { categoryIds?: string[] }> }) {
    const { categoryIds, ...courseData } = params.data;

    const updated = await this.db.transaction(async (tx) => {
      const [row] = await tx
        .update(courses)
        .set({
          ...courseData,
          price: (courseData.price !== undefined && courseData.price !== null) ? Math.round(courseData.price) : (courseData.price === null ? null : undefined),
          updatedAt: new Date(),
        })
        .where(eq(courses.id, params.courseId))
        .returning();

      if (!row) throw new Error('Course not found');

      if (categoryIds !== undefined) {
        await tx
          .delete(courseCategories)
          .where(eq(courseCategories.courseId, params.courseId));

        if (categoryIds.length > 0) {
          await tx.insert(courseCategories).values(
            categoryIds.map((cid) => ({
              courseId: params.courseId,
              categoryId: cid,
            })),
          );
        }
      }

      return row;
    });

    return { ...updated, ownerId: updated.ownerId ?? '' };
  }

  async softDelete(courseId: string): Promise<void> {
    await this.db
      .update(courses)
      .set({
        isActive: false,
        status: 'archived',
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));
  }

  async findRawById(courseId: string) {
    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
        coverImageFileId: courses.coverImageUrl,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    return rows[0] ?? null;
  }

  async updateImageAtomic(params: {
    courseId: string;
    ownerId: string;
    newFileId: string;
  }) {
    return this.db.transaction(async (tx) => {
      const rows = await tx
        .select({
          coverImageFileId: courses.coverImageUrl,
        })
        .from(courses)
        .innerJoin(schools, eq(schools.id, courses.schoolId))
        .where(
          and(
            eq(courses.id, params.courseId),
            eq(schools.ownerId, params.ownerId),
          ),
        )
        .limit(1);

      if (!rows.length) {
        throw new Error('Course not found or not owned by user');
      }

      const oldFileId = rows[0].coverImageFileId;

      await tx
        .update(courses)
        .set({
          coverImageUrl: params.newFileId,
          updatedAt: new Date(),
        })
        .where(eq(courses.id, params.courseId));

      return { oldFileId };
    });
  }
}