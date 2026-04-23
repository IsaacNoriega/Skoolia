import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { AuthModule } from '../auth/auth.module';
import { CoursesModule } from '../courses/courses.module';
import { ListMyCoursesUseCase } from '../courses/core/use-cases/list-my-courses.use-case';

@Module({
  imports: [AuthModule, CoursesModule],
  providers: [LeadService, ListMyCoursesUseCase],
  controllers: [LeadController],
  exports: [LeadService],
})
export class LeadModule {}
