import { courseSubscriptions } from 'drizzle/schemas/courses';
import { plans } from 'drizzle/schemas/schools/plans';
import { Inject, Injectable } from '@nestjs/common';
import { eq, and, gte } from 'drizzle-orm';
import { courses } from 'drizzle/schemas/courses/courses';
import { CourseRepository } from 'src/courses/core/ports/course.repository';
import { Course } from 'src/courses/core/entities/course.types';
import { DATABASE } from 'src/db/db.module';
import * as dbTypes from 'src/db/db.types';
import { files, schools, privateUsers } from 'drizzle/schemas';
import { alias } from 'drizzle-orm/pg-core';

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
    price: number;
    capacity?: number;
    startDate?: Date;
    endDate?: Date;
    modality?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<Course> {
    const [course] = await this.db
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
      })
      .returning();

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
        coverImageUrl: coverFile.url,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
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
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(eq(courses.id, id))
      .limit(1);

    if (!rows.length) return null;

    const course = { ...rows[0], ownerId: rows[0].ownerId ?? '' };
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
        coverImageUrl: coverFile.url,
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
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(eq(courses.ownerId, ownerId));

    return rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
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
        coverImageUrl: coverFile.url,
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
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(and(eq(courses.schoolId, schoolId), eq(courses.isActive, true)));

    return rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
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
        coverImageUrl: coverFile.url,
        price: courses.price,
        capacity: courses.capacity,
        startDate: courses.startDate,
        endDate: courses.endDate,
        modality: courses.modality,
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
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .leftJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(privateUsers, eq(privateUsers.id, courses.ownerId))
      .where(eq(courses.isActive, true));

    return rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
  }

  async update(params: { courseId: string; data: Partial<Course> }) {
    const [updated] = await this.db
      .update(courses)
      .set({
        ...params.data,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, params.courseId))
      .returning();

    if (!updated) throw new Error('Course not found');

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