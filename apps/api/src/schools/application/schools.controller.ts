import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CreateSchoolUseCase } from '../core/use-cases/create-school.use-case';
import { GetMySchoolUseCase } from '../core/use-cases/get-my-school.use-case';
import { UpdateSchoolUseCase } from '../core/use-cases/update-school.use-case';
import { GetSchoolByIdUseCase } from '../core/use-cases/get-school-by-id.use-case';
import { AssignSchoolCategoriesUseCase } from '../core/use-cases/assign-school-categories.use-case';
import { FindNearbySchoolsUseCase } from '../core/use-cases/find-nearby-schools.use-case';
import { UpdateSchoolImageUseCase } from '../core/use-cases/UpdateSchooImage.use-case';

import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { RolesGuard } from 'src/auth/application/guards/roles.guard';
import { Roles } from 'src/auth/application/decorators/roles.decorator';
import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';

import type { JwtPayload } from 'src/auth/core/types/jwt-payload';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AssignCategoriesDto } from './dto/assign-categories.dto';

@Controller('schools')
export class SchoolsController {
  constructor(
    private readonly createSchoolUseCase: CreateSchoolUseCase,
    private readonly getMySchoolUseCase: GetMySchoolUseCase,
    private readonly updateSchoolUseCase: UpdateSchoolUseCase,
    private readonly getSchoolByIdUseCase: GetSchoolByIdUseCase,
    private readonly assignSchoolCategoriesUseCase: AssignSchoolCategoriesUseCase,
    private readonly findNearbySchoolsUseCase: FindNearbySchoolsUseCase,
    private readonly updateSchoolImageUseCase: UpdateSchoolImageUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async create(
    @Body() createSchoolDto: CreateSchoolDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.createSchoolUseCase.execute({
      ...createSchoolDto,
      ownerId: user.sub,
      role: user.role,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async getMySchool(@CurrentUser() user: JwtPayload) {
    return this.getMySchoolUseCase.execute({
      ownerId: user.sub,
      role: user.role,
    });
  }

  @Get(':id')
  async getSchoolById(@Param('id') id: string) {
    return this.getSchoolByIdUseCase.execute({ id });
  }

  @Patch()
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async update(
    @Body() updateSchoolDto: UpdateSchoolDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateSchoolUseCase.execute({
      ownerId: user.sub,
      role: user.role,
      data: updateSchoolDto,
    });
  }

  @Post('categories')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async assignCategories(
    @Body() dto: AssignCategoriesDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.assignSchoolCategoriesUseCase.execute({
      ownerId: user.sub,
      role: user.role,
      categoryIds: dto.categoryIds,
    });
  }

  @Get('nearby/:lat/:lng')
  async findNearby(@Param('lat') lat: string, @Param('lng') lng: string) {
    return this.findNearbySchoolsUseCase.execute({
      lat: Number.parseFloat(lat),
      lng: Number.parseFloat(lng),
      radius: 10,
    });
  }

  @Patch('me/image/:field')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('private')
  async updateImage(
    @Param('field') field: 'logoUrl' | 'coverImageUrl',
    @Body('fileId') fileId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.updateSchoolImageUseCase.execute({
      ownerId: user.sub,
      role: user.role,
      field,
      fileId,
    });
  }
}
