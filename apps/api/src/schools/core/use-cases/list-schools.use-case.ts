import { Inject } from '@nestjs/common';
import { SCHOOL_REPOSITORY } from '../ports/tokens';
import type { SchoolRepository } from '../ports/school.repository';

export class ListSchoolsFeedUseCase {
  constructor(
    @Inject(SCHOOL_REPOSITORY)
    private readonly schoolRepository: SchoolRepository,
  ) {}

  async execute(params: {
    filters?: {
      educationalLevel?: string;
      city?: string;
      categoryId?: string;
      schedule?: string;
      languages?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      sortBy?: 'favorites' | 'rating' | 'recent';
      onlyVerified?: boolean;
      state?: string;
    };
    pagination?: {
      first: number;
      after?: string;
    };
  }) {
    return this.schoolRepository.listForFeed({
      filters: params.filters ?? {},
      pagination: params.pagination,
    });
  }
}
