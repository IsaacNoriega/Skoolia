import { Module } from '@nestjs/common';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

import { SCHOOL_RATINGS_REPOSITORY, COURSE_RATINGS_REPOSITORY } from './core/ports/tokens';
import { DrizzleSchoolRatingsRepository } from './infraestructure/adapters/drizzle-school-ratings.repository';
import { DrizzleCourseRatingsRepository } from './infraestructure/adapters/drizzle-course-ratings.repository';

import { UpsertSchoolRatingUseCase } from './core/use-cases/upsert-school-rating.use-case';
import { SchoolRatingsController } from './application/ratings.controller';
import { CourseRatingsController } from './application/course-ratings.controller';
import { DeleteSchoolRatingUseCase } from './core/use-cases/delete-rating.use-case';
import { ListSchoolRatingsUseCase } from './core/use-cases/list-school-ratings.use-case';
import { GetMySchoolRatingUseCase } from './core/use-cases/get-my-school-rating.use-case';
import { UpsertCourseRatingUseCase } from './core/use-cases/upsert-course-rating.use-case';
import { ListCourseRatingsUseCase } from './core/use-cases/list-course-ratings.use-case';

@Module({
  imports: [DbModule, AuthModule],
  controllers: [SchoolRatingsController, CourseRatingsController],
  providers: [
    UpsertSchoolRatingUseCase,
    DeleteSchoolRatingUseCase,
    ListSchoolRatingsUseCase,
    GetMySchoolRatingUseCase,
    UpsertCourseRatingUseCase,
    ListCourseRatingsUseCase,
    {
      provide: SCHOOL_RATINGS_REPOSITORY,
      useClass: DrizzleSchoolRatingsRepository,
    },
    {
      provide: COURSE_RATINGS_REPOSITORY,
      useClass: DrizzleCourseRatingsRepository,
    },
  ],
})
export class RatingsModule {}
