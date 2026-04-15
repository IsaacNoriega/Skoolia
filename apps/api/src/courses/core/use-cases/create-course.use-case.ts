import {
  Inject,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';
import { SCHOOL_REPOSITORY } from 'src/schools/core/ports/tokens';
import type { SchoolRepository } from 'src/schools/core/ports/school.repository';

export class CreateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,

    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async execute(params: {
    ownerId: string;
    role?: 'public' | 'private';
    name: string;
    description?: string;
    coverImageUrl?: string;
    price?: number;
    capacity?: number;
    startDate?: Date;
    endDate?: Date;
    modality?: string;
  }) {
    // Ya no se requiere ser "private" ni tener escuela

    if (params.startDate && params.endDate) {
      if (params.startDate > params.endDate) {
        throw new BadRequestException('Start date must be before end date');
      }
    }

    if (params.price !== undefined && params.price !== null && params.price <= 0) {
      throw new BadRequestException('Price must be greater than zero');
    }

    if (params.capacity && params.capacity <= 0) {
      throw new BadRequestException('Capacity must be greater than zero');
    }

    // Permitir cursos sin escuela
    return this.courseRepository.create({
      name: params.name,
      description: params.description,
      coverImageUrl: params.coverImageUrl,
      price: params.price ?? null,
      capacity: params.capacity,
      startDate: params.startDate,
      endDate: params.endDate,
      modality: params.modality,
    });
  }
}
