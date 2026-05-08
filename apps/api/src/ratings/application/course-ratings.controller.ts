import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { UpsertSchoolRatingDto as UpsertCourseRatingDto } from './dto/upsert-school-rating.dto';
import { UpsertCourseRatingUseCase } from '../core/use-cases/upsert-course-rating.use-case';
import { ListCourseRatingsUseCase } from '../core/use-cases/list-course-ratings.use-case';

@Controller('courses/:courseId/ratings')
export class CourseRatingsController {
  constructor(
    private readonly upsertRating: UpsertCourseRatingUseCase,
    private readonly listRatings: ListCourseRatingsUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async upsert(
    @Param('courseId') courseId: string,
    @Body() dto: UpsertCourseRatingDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.upsertRating.execute(user, {
      courseId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  @Get()
  async list(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.listRatings.execute({
      courseId,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
