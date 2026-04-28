import {
  Inject,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';
import { SCHOOL_REPOSITORY } from 'src/schools/core/ports/tokens';
import type { SchoolRepository } from 'src/schools/core/ports/school.repository';
import { SubscriptionsService } from 'src/subscriptions/application/subscriptions.service';

export class CreateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,

    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,

    private readonly subscriptionsService: SubscriptionsService,
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
    const activePlan = await this.subscriptionsService.getSchoolActivePlanByOwner(params.ownerId);
      
    if (activePlan && activePlan.plan.name.toLowerCase() === 'freemium') {
      const courses = await this.courseRepository.findByOwner(params.ownerId);
      const activeCoursesCount = courses.filter(c => c.status !== 'archived').length;
      
      if (activeCoursesCount >= 1) {
        throw new ForbiddenException('Has alcanzado el límite de cursos de tu plan. Necesitas el plan Premium para crear más cursos.');
      }
    }

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
      ownerId: params.ownerId,
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
