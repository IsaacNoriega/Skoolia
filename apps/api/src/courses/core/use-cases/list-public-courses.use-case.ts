import { Inject } from '@nestjs/common';
import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';

export class ListPublicCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepository,
  ) {}

  async execute() {
    return this.repository.findAllPublic();
  }
}
