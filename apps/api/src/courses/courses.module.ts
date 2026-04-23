import { ToggleCourseFavoriteUseCase } from './core/use-cases/toggle-course-favorite.use-case';
import { COURSE_FAVORITES_REPOSITORY } from './core/ports/course-favorites.tokens';
import { DrizzleCourseFavoritesRepository } from './infrastructure/adapters/drizzle-course-favorites.repository';
import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { SchoolsModule } from 'src/schools/schools.module';
import { AuthModule } from 'src/auth/auth.module';

import { CoursesController } from './application/courses.controller';

import { CreateCourseUseCase } from './core/use-cases/create-course.use-case';
import { GetCourseByIdUseCase } from './core/use-cases/get-course-by-id.use-case';
import { UpdateCourseUseCase } from './core/use-cases/update-course.use-case';
import { DeleteCourseUseCase } from './core/use-cases/delete-course.use-case';
import { UpdateCourseImageUseCase } from './core/use-cases/update-image.use-case';
import { FilesModule } from 'src/files/files.module';
import { ListMyCoursesUseCase } from './core/use-cases/list-my-courses.use-case';
import { ListPublicCoursesBySchoolUseCase } from './core/use-cases/list-public-courses-by-school.use-case';
import { ListPublicCoursesUseCase } from './core/use-cases/list-public-courses.use-case';
import { DrizzleCourseRepository } from './infrastructure/adapters/drizzle-course.repository';
import { COURSE_REPOSITORY } from './core/ports/tokens';

@Module({
  imports: [DbModule, SchoolsModule, AuthModule, FilesModule],
  controllers: [CoursesController],
  providers: [
    CreateCourseUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
    UpdateCourseImageUseCase,
    ListMyCoursesUseCase,
    ListPublicCoursesBySchoolUseCase,
    ListPublicCoursesUseCase,
    GetCourseByIdUseCase,
    ToggleCourseFavoriteUseCase,
    {
      provide: COURSE_REPOSITORY,
      useClass: DrizzleCourseRepository,
    },
    {
      provide: COURSE_FAVORITES_REPOSITORY,
      useClass: DrizzleCourseFavoritesRepository,
    },
  ],
  exports: [COURSE_REPOSITORY, COURSE_FAVORITES_REPOSITORY],
})
export class CoursesModule {}
