import { Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import type { FavoritesRepository } from '../ports/favorites.repository';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';
import { DrizzleCourseFavoritesRepository } from 'src/courses/infrastructure/adapters/drizzle-course-favorites.repository';

@Injectable()
export class CheckFavoriteUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepository: FavoritesRepository,
    @Inject(DrizzleCourseFavoritesRepository)
    private readonly courseFavoritesRepository: DrizzleCourseFavoritesRepository,
  ) {}

  async execute(user: JwtPayload, targetId: string) {
    if (user.role !== 'public') {
      return { isFavorite: false };
    }

    // 1. Check if it's a school favorite
    const existsInSchools = await this.favoritesRepository.existsByUserAndSchool({
      publicUserId: user.sub,
      schoolId: targetId,
    });

    if (existsInSchools) {
      return { isFavorite: true };
    }

    // 2. Check if it's a course favorite
    const existsInCourses = await this.courseFavoritesRepository.existsByUserAndCourse({
      publicUserId: user.sub,
      courseId: targetId,
    });

    return { isFavorite: existsInCourses };
  }
}
