import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';

import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';

import { courses, courseRatings, publicUsers } from 'drizzle/schemas';
import type { CourseRatingsRepository } from '../../core/ports/course-ratings.repository';
import type { CourseRating } from '../../core/entities/course-rating.types';

@Injectable()
export class DrizzleCourseRatingsRepository implements CourseRatingsRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  async findCourseById(courseId: string) {
    const rows = await this.db
      .select({ id: courses.id })
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1);

    return rows[0] ?? null;
  }

  async findByUserAndCourse(params: {
    publicUserId: string;
    courseId: string;
  }) {
    const rows = await this.db
      .select()
      .from(courseRatings)
      .where(
        and(
          eq(courseRatings.publicUserId, params.publicUserId),
          eq(courseRatings.courseId, params.courseId),
        ),
      )
      .limit(1);

    return (rows[0] ?? null) as CourseRating | null;
  }

  async upsert(params: {
    publicUserId: string;
    courseId: string;
    rating: number;
    comment?: string;
  }) {
    const [row] = await this.db
      .insert(courseRatings)
      .values({
        publicUserId: params.publicUserId,
        courseId: params.courseId,
        rating: params.rating,
        comment: params.comment ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [courseRatings.courseId, courseRatings.publicUserId],
        set: {
          rating: params.rating,
          comment: params.comment ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return row as CourseRating;
  }

  async remove(params: { publicUserId: string; courseId: string }) {
    await this.db
      .delete(courseRatings)
      .where(
        and(
          eq(courseRatings.publicUserId, params.publicUserId),
          eq(courseRatings.courseId, params.courseId),
        ),
      );
  }

  async listByCourse(params: {
    courseId: string;
    limit: number;
    offset: number;
  }) {
    const rows = await this.db
      .select({
        id: courseRatings.id,
        courseId: courseRatings.courseId,
        publicUserId: courseRatings.publicUserId,
        rating: courseRatings.rating,
        comment: courseRatings.comment,
        createdAt: courseRatings.createdAt,
        updatedAt: courseRatings.updatedAt,
        userName: publicUsers.name,
        userAvatar: publicUsers.avatarUrl,
      })
      .from(courseRatings)
      .leftJoin(publicUsers, eq(publicUsers.id, courseRatings.publicUserId))
      .where(eq(courseRatings.courseId, params.courseId))
      .orderBy(sql`${courseRatings.createdAt} desc`)
      .limit(params.limit)
      .offset(params.offset);

    return rows as CourseRating[];
  }

  async recalcCourseRatingStats(courseId: string) {
    const [agg] = await this.db
      .select({
        avg: sql<number>`coalesce(avg(${courseRatings.rating}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(courseRatings)
      .where(eq(courseRatings.courseId, courseId));

    await this.db
      .update(courses)
      .set({
        averageRating: agg?.avg ?? 0,
        ratingsCount: agg?.count ?? 0,
        updatedAt: new Date(),
      })
      .where(eq(courses.id, courseId));
  }
}
