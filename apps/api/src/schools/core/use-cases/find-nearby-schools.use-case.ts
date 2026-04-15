import { Inject } from '@nestjs/common';
import { SCHOOL_REPOSITORY } from '../ports/tokens';
import type { SchoolRepository } from '../ports/school.repository';

export class FindNearbySchoolsUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async execute(params: { lat: number; lng: number; radius?: number }) {
    // Radio por defecto 50km si no se especifica
    const radius = params.radius ?? 50;
    return this.schoolRepository.findNearby(params.lat, params.lng, radius);
  }
}
