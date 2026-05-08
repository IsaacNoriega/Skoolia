import { Inject } from '@nestjs/common';
import { COURSE_RATINGS_REPOSITORY } from '../ports/tokens';
import type { CourseRatingsRepository } from '../ports/course-ratings.repository';

export class ListCourseRatingsUseCase {
  constructor(
    @Inject(COURSE_RATINGS_REPOSITORY)
    private readonly ratingsRepo: CourseRatingsRepository,
  ) {}

  async execute(params: { courseId: string; page?: number; pageSize?: number }) {
    const limit = params.pageSize || 10;
    const offset = ((params.page || 1) - 1) * limit;

    return this.ratingsRepo.listByCourse({
      courseId: params.courseId,
      limit,
      offset,
    });
  }
}
