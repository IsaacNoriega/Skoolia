import { Module } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { EnrollmentsController } from './enrollments.controller';
import { LeadModule } from 'src/leads/lead.module';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [DbModule, AuthModule, LeadModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService],
  exports: [EnrollmentsService],
})
export class EnrollmentsModule {}
