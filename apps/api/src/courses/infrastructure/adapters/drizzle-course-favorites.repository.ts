import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { courses } from 'drizzle/schemas/courses';
import { courseFavorites } from 'drizzle/schemas/courses';
import { DATABASE } from 'src/db/db.module';
import * as dbTypes from 'src/db/db.types';
import { CourseFavoritesRepository } from 'src/courses/core/ports/course-favorites.repository';

@Injectable()
export class DrizzleCourseFavoritesRepository implements CourseFavoritesRepository {
  constructor(@Inject(DATABASE) private readonly db: dbTypes.Database) {}

  async existsByUserAndCourse(params: {
    publicUserId: string;
    courseId: string;
  }): Promise<boolean> {
    const rows = await this.db
      .select({ id: courseFavorites.id })
      .from(courseFavorites)
      .where(
        and(
          eq(courseFavorites.publicUserId, params.publicUserId),
          eq(courseFavorites.courseId, params.courseId),
        ),
      )
      .limit(1);

    return !!rows[0];
  }

  async add(params: { publicUserId: string; courseId: string }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(courseFavorites).values({
        publicUserId: params.publicUserId,
        courseId: params.courseId,
      });

      await tx
        .update(courses)
        .set({
          favoritesCount: sql`${courses.favoritesCount} + 1`,
        })
        .where(eq(courses.id, params.courseId));
    });
  }

  async remove(params: { publicUserId: string; courseId: string }): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(courseFavorites)
        .where(
          and(
            eq(courseFavorites.publicUserId, params.publicUserId),
            eq(courseFavorites.courseId, params.courseId),
          ),
        );

      await tx
        .update(courses)
        .set({
          favoritesCount: sql`GREATEST(${courses.favoritesCount} - 1, 0)`,
        })
        .where(eq(courses.id, params.courseId));
    });
  }

  async listForUser(publicUserId: string): Promise<any[]> {
    const rows = await this.db
      .select({
        id: courses.id,
        name: courses.name,
        description: courses.description,
        coverImageUrl: courses.coverImageUrl,
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
        favoritesCount: courses.favoritesCount,
        createdAt: courses.createdAt,
        updatedAt: courses.updatedAt,
      })
      .from(courses)
      .innerJoin(courseFavorites, eq(courseFavorites.courseId, courses.id))
      .where(eq(courseFavorites.publicUserId, publicUserId));

    return rows;
  }
}
