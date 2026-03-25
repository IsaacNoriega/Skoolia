import { BadRequestException, Inject } from '@nestjs/common';

import type { JwtPayload } from 'src/auth/core/types/jwt-payload';

import { COURSE_REPOSITORY } from '../ports/tokens';
import type { CourseRepository } from '../ports/course.repository';

export class ListMyCoursesUseCase {
  constructor(
    @Inject(COURSE_REPOSITORY)
    private readonly repository: CourseRepository,
  ) {}

  async execute(user: JwtPayload) {
    if (user.role !== 'private') {
      throw new BadRequestException(
        'Only private users can list their courses',
      );
    }

    return this.repository.findByOwner(user.sub);
  }
}
