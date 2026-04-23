import { Inject, Injectable } from '@nestjs/common';
import { FAVORITES_REPOSITORY } from '../ports/tokens';
import type { FavoritesRepository } from '../ports/favorites.repository';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';
import { DrizzleCourseFavoritesRepository } from 'src/courses/infrastructure/adapters/drizzle-course-favorites.repository';

@Injectable()
export class ListFavoritesUseCase {
  constructor(
    @Inject(FAVORITES_REPOSITORY)
    private readonly favoritesRepository: FavoritesRepository,
    @Inject(DrizzleCourseFavoritesRepository)
    private readonly courseFavoritesRepository: DrizzleCourseFavoritesRepository,
  ) {}

  async execute(user: JwtPayload) {
    // Escuelas favoritas
    const schools = await this.favoritesRepository.listForUser(user.sub);
    // Cursos favoritos
    const courses = await this.courseFavoritesRepository.listForUser(user.sub);

    // Normaliza y agrega el tipo
    const schoolsWithType = schools.map(s => ({ ...s, type: 'SCHOOL' }));
    const coursesWithType = courses.map(c => ({ ...c, type: 'COURSE' }));

    // Junta ambos
    return [...schoolsWithType, ...coursesWithType];
  }
}
