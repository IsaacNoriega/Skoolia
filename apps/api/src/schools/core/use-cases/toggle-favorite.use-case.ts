import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import type { FavoritesRepository } from '../ports/favorites.repository';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';
import { DrizzleCourseFavoritesRepository } from 'src/courses/infrastructure/adapters/drizzle-course-favorites.repository';
import { DATABASE } from 'src/db/db.module';
import type { Database } from 'src/db/db.types';
import { schools } from '../../../../drizzle/schemas/schools/school';
import { courses } from '../../../../drizzle/schemas/courses/courses';
import { eq } from 'drizzle-orm';

@Injectable()
export class ToggleFavoriteUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepository: FavoritesRepository,
    @Inject(DrizzleCourseFavoritesRepository)
    private readonly courseFavoritesRepository: DrizzleCourseFavoritesRepository,
    @Inject(DATABASE)
    private readonly db: Database,
  ) {}

  async execute(user: JwtPayload, targetId: string) {
    if (user.role !== 'public') {
      throw new ForbiddenException();
    }

    // Determinar si es escuela o curso
    const school = await this.db.select({ id: schools.id }).from(schools).where(eq(schools.id, targetId)).limit(1);
    
    if (school.length > 0) {
      const exists = await this.favoritesRepository.existsByUserAndSchool({
        publicUserId: user.sub,
        schoolId: targetId,
      });

      if (exists) {
        await this.favoritesRepository.remove({
          publicUserId: user.sub,
          schoolId: targetId,
        });
        return { isFavorite: false };
      }

      await this.favoritesRepository.add({
        publicUserId: user.sub,
        schoolId: targetId,
      });
      return { isFavorite: true };
    }

    // Intentar con curso
    const course = await this.db.select({ id: courses.id }).from(courses).where(eq(courses.id, targetId)).limit(1);
    if (course.length > 0) {
      const exists = await this.courseFavoritesRepository.existsByUserAndCourse({
        publicUserId: user.sub,
        courseId: targetId,
      });

      if (exists) {
        await this.courseFavoritesRepository.remove({
          publicUserId: user.sub,
          courseId: targetId,
        });
        return { isFavorite: false };
      }

      await this.courseFavoritesRepository.add({
        publicUserId: user.sub,
        courseId: targetId,
      });
      return { isFavorite: true };
    }

    throw new Error('Target not found');
  }
}
