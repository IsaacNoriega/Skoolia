import { ForbiddenException, Inject } from '@nestjs/common';
import { COURSE_FAVORITES_REPOSITORY } from '../ports/course-favorites.tokens';
import type { CourseFavoritesRepository } from '../ports/course-favorites.repository';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

export class ToggleCourseFavoriteUseCase {
  constructor(
    @Inject(COURSE_FAVORITES_REPOSITORY)
    private readonly favoritesRepository: CourseFavoritesRepository,
  ) {}

  async execute(user: JwtPayload, courseId: string) {
    if (user.role !== 'public') {
      throw new ForbiddenException();
    }

    const exists = await this.favoritesRepository.existsByUserAndCourse({
      publicUserId: user.sub,
      courseId,
    });

    if (exists) {
      await this.favoritesRepository.remove({
        publicUserId: user.sub,
        courseId,
      });
      return { isFavorite: false };
    }

    await this.favoritesRepository.add({
      publicUserId: user.sub,
      courseId,
    });
    return { isFavorite: true };
  }
}
