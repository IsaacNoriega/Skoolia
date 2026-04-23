import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as courseRepository from '../ports/course.repository';
import { COURSE_REPOSITORY } from '../ports/tokens';

@Injectable()
export class GetCourseByIdUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly coursesRepository: courseRepository.CourseRepository,
  ) {}

  async execute(courseId: string) {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) throw new NotFoundException('Curso no encontrado');
    return course;
  }
}
