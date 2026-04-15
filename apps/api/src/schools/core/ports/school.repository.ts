import { SchoolsConnection } from 'src/schools/core/entities/schools-connection';
import type { School } from '../entities/school.types';

export interface SchoolRepository {
  create(params: {
    name: string;
    description?: string;
    ownerId: string;
    latitude?: number;
    longitude?: number;
  }): Promise<School>;

  findById(id: string): Promise<School | null>;

  update(params: { ownerId: string; data: Partial<School> }): Promise<School>;

  list(): Promise<School[]>;

  assignCategories(schoolId: string, categoryIds: string[]): Promise<void>;

  findByOwner(ownerId: string): Promise<School | null>;

  listForFeed(params: {
    filters?: {
      educationalLevel?: string;
      city?: string;
      state?: string;
      categoryId?: string;
      schedule?: string;
      languages?: string;
      minPrice?: number;
      maxPrice?: number;
      search?: string;
      sortBy?: 'favorites' | 'rating' | 'recent';
      onlyVerified?: boolean;
      latitude?: number;
      longitude?: number;
    };
    pagination?: {
      first: number;
      after?: string;
    };
  }): Promise<SchoolsConnection>;

  findRawByOwner(ownerId: string): Promise<{
    id: string;
    logoFileId: string | null;
    coverImageFileId: string | null;
  } | null>;

  updateImageAtomic(params: {
    ownerId: string;
    field: 'logoUrl' | 'coverImageUrl';
    newFileId: string;
  }): Promise<{ oldFileId: string | null }>;
  
  findNearby(lat: number, lng: number, radius: number): Promise<any>;
}
