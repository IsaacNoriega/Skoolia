import { Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';
import { SCHOOL_REPOSITORY } from 'src/schools/core/ports/tokens';
import type { SchoolRepository } from 'src/schools/core/ports/school.repository';

export class UpdateCourseUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: CourseRepository,

    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async execute(params: {
    ownerId: string;
    role: 'public' | 'private';
    courseId: string;
    data: {
      name?: string;
      description?: string;
      price?: number;
      capacity?: number;
      startDate?: Date;
      endDate?: Date;
      modality?: string;
      status?: 'draft' | 'published' | 'archived';
      isActive?: boolean;
    };
  }) {
    if (params.role !== 'private') {
      throw new ForbiddenException();
    }

    // Eliminada validación de escuela, solo se valida dueño del curso

    const course = await this.courseRepository.findById(params.courseId);

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Permitir si el usuario es dueño del curso, aunque no tenga escuela
    if (course.ownerId !== params.ownerId) {
      throw new ForbiddenException('You cannot update a course you do not own');
    }

    // Validar features del plan de suscripción
    // Si el curso tiene suscripción y el plan no permite editar, lanzar error
    if (course.subscription && course.subscription.plan && Array.isArray(course.subscription.plan.features)) {
      if (!course.subscription.plan.features.includes('edit_course')) {
        throw new ForbiddenException('El plan de suscripción de este curso no permite editarlo.');
      }
    }

    return this.courseRepository.update({
      courseId: params.courseId,
      data: params.data,
    });
  }
}
