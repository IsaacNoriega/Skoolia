
import { Inject, NotFoundException } from '@nestjs/common';
import { USER_REPOSITORY } from '../ports/tokens';
import * as usersRepository from '../ports/users.repository';
import { SCHOOL_REPOSITORY } from 'src/schools/core/ports/tokens';
import * as schoolRepository from 'src/schools/core/ports/school.repository';
import { COURSE_REPOSITORY } from 'src/courses/core/ports/tokens';
import * as coursesRepository from 'src/courses/core/ports/course.repository';


export class GetMyProfileUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly repository: usersRepository.UserRepository,
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: schoolRepository.SchoolRepository,
    @Inject(COURSE_REPOSITORY)
    private readonly courseRepository: coursesRepository.CourseRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.repository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let onboardingRequired = false;

    if (user.role === 'private') {
      const school = await this.schoolRepository.findByOwner(user.id);
      const courses = await this.courseRepository.findByOwner(user.id);
      onboardingRequired = !school && (!courses || courses.length === 0);
    }

    return {
      ...user,
      onboardingRequired,
    };
  }
}
