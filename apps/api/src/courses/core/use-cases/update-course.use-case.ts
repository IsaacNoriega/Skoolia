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

    // Si tiene escuela, validar que sea dueño de la escuela (opcional, puedes quitar este bloque si ya no aplica)
    // if (course.schoolId && course.schoolId !== school.id) {
    //   throw new ForbiddenException(
    //     'You cannot update a course from another school',
    //   );
    // }

    return this.courseRepository.update({
      courseId: params.courseId,
      data: params.data,
    });
  }
}
