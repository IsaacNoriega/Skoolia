import { Inject } from '@nestjs/common';

import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';

export class ListPublicCoursesBySchoolUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepository,
  ) {}

  async execute(schoolId: string) {
    return this.repository.findPublicBySchoolId(schoolId);
  }
}
