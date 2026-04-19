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
    console.log('[DrizzleCourseRepository][create] params:', params);
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
    console.log('[DrizzleCourseRepository][create] created:', course);
    // ownerId nunca debe ser null
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(eq(courses.id, id))
      .limit(1);
    if (!rows.length) return null;
    // ownerId nunca debe ser null
    return { ...rows[0], ownerId: rows[0].ownerId ?? '' };
  }

  async findByOwner(ownerId: string): Promise<Course[]> {
    const coverFile = alias(files, 'cover_file');
    console.log('[DrizzleCourseRepository][findByOwner] ownerId:', ownerId);
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(eq(courses.ownerId, ownerId));
    console.log('[DrizzleCourseRepository][findByOwner] found:', rows);
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(and(eq(courses.schoolId, schoolId), eq(courses.isActive, true)));
    // ownerId nunca debe ser null
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
      })
      .from(courses)
      .leftJoin(coverFile, eq(coverFile.id, courses.coverImageUrl))
      .where(eq(courses.isActive, true));
    // ownerId nunca debe ser null
    return rows.map(r => ({ ...r, ownerId: r.ownerId ?? '' }));
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
    // ownerId nunca debe ser null
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
