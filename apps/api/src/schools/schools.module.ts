import { AuthModule } from 'src/auth/auth.module';
import { SCHOOL_REPOSITORY } from './core/ports/tokens';
import { AssignSchoolCategoriesUseCase } from './core/use-cases/assign-school-categories.use-case';
import { CreateSchoolUseCase } from './core/use-cases/create-school.use-case';
import { GetMySchoolUseCase } from './core/use-cases/get-my-school.use-case';
import { UpdateSchoolUseCase } from './core/use-cases/update-school.use-case';
import { GetSchoolByIdUseCase } from './core/use-cases/get-school-by-id.use-case';
import { DrizzleSchoolRepository } from './infrastructure/adapters/drizzle-school.repository';
import { FindNearbySchoolsUseCase } from './core/use-cases/find-nearby-schools.use-case';
import { SchoolsController } from './application/schools.controller';
import { DbModule } from 'src/db/db.module';
import { Module } from '@nestjs/common';
import { SchoolsFeedResolver } from './application/graphql/school-feed.resolver';
import { ListSchoolsFeedUseCase } from './core/use-cases/list-schools.use-case';
import { UpdateSchoolImageUseCase } from './core/use-cases/UpdateSchooImage.use-case';
import { FilesModule } from 'src/files/files.module';
import { LeadEventsController } from './application/lead-events.controller';
import { LeadEventsService } from './services/lead-events.service';

@Module({
  imports: [DbModule, AuthModule, FilesModule],
  controllers: [SchoolsController, LeadEventsController],
  providers: [
    CreateSchoolUseCase,
    GetMySchoolUseCase,
    UpdateSchoolUseCase,
    GetSchoolByIdUseCase,
    AssignSchoolCategoriesUseCase,
    DrizzleSchoolRepository,
    SchoolsFeedResolver,
    ListSchoolsFeedUseCase,
    UpdateSchoolImageUseCase,
    FindNearbySchoolsUseCase,
    LeadEventsService,
    {
      provide: SCHOOL_REPOSITORY,
      useClass: DrizzleSchoolRepository,
    },
  ],
  exports: [SCHOOL_REPOSITORY, FindNearbySchoolsUseCase, LeadEventsService],
})
export class SchoolsModule {}
