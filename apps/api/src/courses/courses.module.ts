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
    {
      provide: COURSE_REPOSITORY,
      useClass: DrizzleCourseRepository,
    },
  ],
  exports: [COURSE_REPOSITORY],
})
export class CoursesModule {}
