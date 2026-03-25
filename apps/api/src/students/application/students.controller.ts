import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from 'src/auth/application/guards/auth.guard';
import { CurrentUser } from 'src/auth/application/decorators/current-user.decorator';
import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { CreateStudentDto } from './dto/create-student.dto';
import { CreateStudentUseCase } from '../core/use-cases/create-student.use-case';
import { GetMyStudentUseCase } from '../core/use-cases/get-my-student.use-case';
import { UpdateStudentUseCase } from '../core/use-cases/update-student.use-case';
import { DeleteStudentUseCase } from '../core/use-cases/delete-student.use-case';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentsController {
  constructor(
    @Inject(CreateStudentUseCase)
    private readonly createStudent: CreateStudentUseCase,

    @Inject(GetMyStudentUseCase)
    private readonly getMyStudent: GetMyStudentUseCase,

    @Inject(UpdateStudentUseCase)
    private readonly updateStudent: UpdateStudentUseCase,

    @Inject(DeleteStudentUseCase)
    private readonly deleteStudent: DeleteStudentUseCase,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CreateStudentDto, @CurrentUser() user: JwtPayload) {
    return this.createStudent.execute(user, dto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  async myStudent(@CurrentUser() user: JwtPayload) {
    return this.getMyStudent.execute(user);
  }

  @Patch()
  @UseGuards(AuthGuard)
  async update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateStudentDto) {
    return this.updateStudent.execute(user, dto);
  }

  @Delete()
  @UseGuards(AuthGuard)
  async delete(@CurrentUser() user: JwtPayload) {
    await this.deleteStudent.execute(user);
    return { success: true };
  }
}
