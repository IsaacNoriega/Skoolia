import { Body, Controller, Get, Post, UseGuards, Request, Param } from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AuthGuard } from 'src/auth/application/guards/auth.guard';

@Controller('enrollments')
@UseGuards(AuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateEnrollmentDto) {
    return this.enrollmentsService.createEnrollment(req.user.sub, dto);
  }

  @Get('my')
  async getMy(@Request() req) {
    return this.enrollmentsService.getMyEnrollments(req.user.sub);
  }

  @Get('target/:id')
  async getByTarget(@Param('id') id: string) {
    return this.enrollmentsService.getEnrollmentsByTarget(id);
  }
}
