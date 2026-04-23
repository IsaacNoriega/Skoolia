import { Module } from '@nestjs/common';

import { UsersController } from './application/users.controller';

import { GetMyProfileUseCase } from './core/use-cases/get-my-profile.use-case';
import { UpdateMyProfileUseCase } from './core/use-cases/update-profile.use-case';

import { USER_REPOSITORY } from './core/ports/tokens';
import { DrizzleUserRepository } from './infrstructure/adapters/drizzle-user.repository';
import { AuthModule } from 'src/auth/auth.module';
import { UpdateUserAvatarUseCase } from './core/use-cases/update-user-image.use-case';
import { FilesModule } from 'src/files/files.module';
import { SchoolsModule } from 'src/schools/schools.module';

import { CoursesModule } from 'src/courses/courses.module';

@Module({
  imports: [AuthModule, FilesModule, SchoolsModule, CoursesModule],
  controllers: [UsersController],
  providers: [
    GetMyProfileUseCase,
    UpdateMyProfileUseCase,
    UpdateUserAvatarUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: DrizzleUserRepository,
    },
  ],
})
export class UsersModule {}
