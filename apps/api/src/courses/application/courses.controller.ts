
import { ToggleCourseFavoriteUseCase } from '../core/use-cases/toggle-course-favorite.use-case';
import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { RolesGuard } from 'src/auth/application/guards/roles.guard';
import { Roles } from 'src/auth/application/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';

import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { CreateCourseUseCase } from '../core/use-cases/create-course.use-case';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseUseCase } from '../core/use-cases/update-course.use-case';
import { DeleteCourseUseCase } from '../core/use-cases/delete-course.use-case';
import { UpdateCourseImageDto } from './dto/update-image.dto';
import { UpdateCourseImageUseCase } from '../core/use-cases/update-image.use-case';
import { ListMyCoursesUseCase } from '../core/use-cases/list-my-courses.use-case';
import { ListPublicCoursesBySchoolUseCase } from '../core/use-cases/list-public-courses-by-school.use-case';
import { ListPublicCoursesUseCase } from '../core/use-cases/list-public-courses.use-case';
import { GetCourseByIdUseCase } from '../core/use-cases/get-course-by-id.use-case';

@Controller('courses')
export class CoursesController {
  constructor(
    @Inject(CreateCourseUseCase)
    private readonly createCourse: CreateCourseUseCase,

    @Inject(UpdateCourseUseCase)
    private readonly updateCourse: UpdateCourseUseCase,

    @Inject(DeleteCourseUseCase)
    private readonly deleteCourse: DeleteCourseUseCase,

    @Inject(UpdateCourseImageUseCase)
    private readonly updateCourseImageUseCase: UpdateCourseImageUseCase,

    @Inject(ListMyCoursesUseCase)
    private readonly listMyCourses: ListMyCoursesUseCase,

    @Inject(ListPublicCoursesBySchoolUseCase)
    private readonly listPublicCoursesBySchool: ListPublicCoursesBySchoolUseCase,

    @Inject(ListPublicCoursesUseCase)
    private readonly listPublicCourses: ListPublicCoursesUseCase,
    @Inject(GetCourseByIdUseCase)
    private readonly getCourseById: GetCourseByIdUseCase,
    @Inject(ToggleCourseFavoriteUseCase)
    private readonly toggleCourseFavorite: ToggleCourseFavoriteUseCase,
  ) {}

  /**
   * ❤️ Toggle favorite for course
   * POST /courses/:id/favorite
   */
  @Post(':id/favorite')
  @UseGuards(AuthGuard)
  async toggleFavorite(@Param('id') courseId: string, @CurrentUser() user: JwtPayload) {
    return this.toggleCourseFavorite.execute(user, courseId);
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async listMine(@CurrentUser() user: JwtPayload) {
    return this.listMyCourses.execute(user);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.getCourseById.execute(id);
  }

  /**
   * Crear curso (requiere autenticación)
   */
  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async create(@Body() dto: CreateCourseDto, @CurrentUser() user: JwtPayload) {
    return this.createCourse.execute({
      ownerId: user.sub,
      name: dto.name,
      description: dto.description,
      coverImageUrl: dto.coverImageUrl,
      ...(dto.price !== undefined ? { price: dto.price } : {}),
      capacity: dto.capacity,
      startDate: dto.startDate,
      endDate: dto.endDate,
      modality: dto.modality,
      address: dto.address,
      city: dto.city,
      state: dto.state,
      latitude: dto.latitude,
      longitude: dto.longitude,
      gallery: dto.gallery,
      onlineInstructions: dto.onlineInstructions,
      categoryIds: dto.categoryIds,
    });
  }

  @Get('schools/:schoolId')
  async listPublicBySchool(@Param('schoolId') schoolId: string) {
    return this.listPublicCoursesBySchool.execute(schoolId);
  }

  @Get()
  async listAllPublic() {
    return this.listPublicCourses.execute();
  }

  @Patch(':id/image')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async updateImage(
    @Param('id') courseId: string,
    @Body() dto: UpdateCourseImageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateCourseImageUseCase.execute({
      ownerId: user.sub,
      role: user.role,
      courseId,
      fileId: dto.fileId,
    });
  }

  @Patch(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateCourse.execute({
      ownerId: user.sub,
      role: user.role,
      courseId: id,
      data: dto,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async delete(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.deleteCourse.execute({
      ownerId: user.sub,
      role: user.role,
      courseId: id,
    });
  }
}
