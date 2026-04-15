import { Inject, ForbiddenException, ConflictException } from '@nestjs/common';
import { SCHOOL_REPOSITORY } from '../ports/tokens';
import type { SchoolRepository } from '../ports/school.repository';

export class CreateSchoolUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async execute(params: {
    ownerId: string;
    role: 'public' | 'private';
    name: string;
    description?: string;
    latitude?: number;
    longitude?: number;
  }) {
    if (params.role !== 'private') {
      throw new ForbiddenException('Only private users can create schools');
    }

    const existing = await this.schoolRepository.findByOwner(params.ownerId);

    if (existing) {
      throw new ConflictException('User already has a school');
    }

    return this.schoolRepository.create({
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      latitude: params.latitude,
      longitude: params.longitude,
    });
  }
}
