import type { CourseRating } from '../entities/course-rating.types';

export interface CourseRatingsRepository {
  // read helpers
  findCourseById(courseId: string): Promise<{ id: string } | null>;
  findByUserAndCourse(params: {
    publicUserId: string;
    courseId: string;
  }): Promise<CourseRating | null>;

  // write
  upsert(params: {
    publicUserId: string;
    courseId: string;
    rating: number;
    comment?: string;
  }): Promise<CourseRating>;

  remove(params: { publicUserId: string; courseId: string }): Promise<void>;

  // list
  listByCourse(params: {
    courseId: string;
    limit: number;
    offset: number;
  }): Promise<CourseRating[]>;

  // aggregates
  recalcCourseRatingStats(courseId: string): Promise<void>;
}
