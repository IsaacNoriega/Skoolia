import { ForbiddenException, Inject, NotFoundException } from '@nestjs/common';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';
import { COURSE_RATINGS_REPOSITORY } from '../ports/tokens';
import type { CourseRatingsRepository } from '../ports/course-ratings.repository';

export class UpsertCourseRatingUseCase {
  constructor(
    @Inject(COURSE_RATINGS_REPOSITORY)
    private readonly ratingsRepo: CourseRatingsRepository,
  ) {}

  async execute(
    user: JwtPayload,
    params: { courseId: string; rating: number; comment?: string },
  ) {
    if (user.role !== 'public') throw new ForbiddenException('Solo los padres pueden calificar cursos');

    if (params.rating < 1 || params.rating > 5) {
      throw new ForbiddenException('Rating must be between 1 and 5');
    }

    const course = await this.ratingsRepo.findCourseById(params.courseId);
    if (!course) throw new NotFoundException('Course not found');

    const saved = await this.ratingsRepo.upsert({
      publicUserId: user.sub,
      courseId: params.courseId,
      rating: params.rating,
      comment: params.comment,
    });

    await this.ratingsRepo.recalcCourseRatingStats(params.courseId);

    return saved;
  }
}
