import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { courses } from 'drizzle/schemas/courses/courses';
import { CourseRepository } from 'src/courses/core/ports/course.repository';
import { Course } from 'src/courses/core/entities/course.types';
import { DATABASE } from 'src/db/db.module';
import * as dbTypes from 'src/db/db.types';
import { files, schools } from 'drizzle/schemas';
import { alias } from 'drizzle-orm/pg-core';

@Injectable()
export class DrizzleCourseRepository implements CourseRepository {
  constructor(@Inject(DATABASE) private readonly db: dbTypes.Database) {}

  async create(params: {
    schoolId?: string | null;
    name: string;
    description?: string;
    coverImageUrl?: string;
    price: number;
    capacity?: number;
    startDate?: Date;
    endDate?: Date;
    modality?: string;
  }): Promise<Course> {
    const [course] = await this.db
      .insert(courses)
      .values({
        schoolId: params.schoolId ?? null,
        name: params.name,
        description: params.description ?? null,
        coverImageUrl: params.coverImageUrl ?? null,
        price: params.price ?? null,
        capacity: params.capacity ?? null,
        startDate: params.startDate ?? null,
        endDate: params.endDate ?? null,
        modality: params.modality ?? null,
      })
      .returning();

    return course;
  }

  async findById(id: string): Promise<Course | null> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,

        name: courses.name,
        description: courses.description,

        // 👇 URL real que viene de files
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(eq(courses.id, id))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByOwner(ownerId: string): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
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
      })
      .from(courses)
      .innerJoin(schools, eq(schools.id, courses.schoolId))
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(eq(schools.ownerId, ownerId));

    return rows;
  }

  async findPublicBySchoolId(schoolId: string): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');

    const rows = await this.db
      .select({
        id: courses.id,
        schoolId: courses.schoolId,
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(and(eq(courses.schoolId, schoolId), eq(courses.isActive, true)));

    return rows;
  }

  async update(params: { courseId: string; data: Partial<Course> }) {
    const [updated] = await this.db
      .update(courses)
      .set({
        ...params.data,
        updatedAt: new Date(), // 🔥 backend controla esto
      })
      .where(eq(courses.id, params.courseId))
      .returning();

    return updated;
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

  async findRawById(courseId: string): Promise<{
    id: string;
    schoolId: string | null;
    coverImageFileId: string | null;
  } | null> {
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
  }): Promise<{
    oldFileId: string | null;
  }> {
    return this.db.transaction(async (tx) => {
      // 1️⃣ Obtener curso con validación de owner
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

      // 2️⃣ Update FK
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
