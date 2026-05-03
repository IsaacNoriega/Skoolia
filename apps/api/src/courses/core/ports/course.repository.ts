import type { Course } from '../entities/course.types';

export interface CourseRepository {
  findAllPublic(): Promise<Course[]>;
  create(params: {
    schoolId?: string | null;
    ownerId: string;
    name: string;
    description?: string;
    coverImageUrl?: string;
    price: number | null;
    capacity?: number;
    startDate?: Date;
    endDate?: Date;
    modality?: string;
    address?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
    gallery?: string[];
  }): Promise<Course>;

  findByOwner(ownerId: string): Promise<Course[]>;

  findPublicBySchoolId(schoolId: string): Promise<Course[]>;

  update(params: {
    courseId: string;
    data: {
      name?: string;
      description?: string;
      coverImageUrl?: string;
      price?: number;
      capacity?: number;
      startDate?: Date;
      endDate?: Date;
      modality?: string;
      status?: 'draft' | 'published' | 'archived';
      isActive?: boolean;
      gallery?: string[];
    };
  }): Promise<Course>;

  findById(id: string): Promise<Course | null>;

  findRawById(courseId: string): Promise<{
    id: string;
    schoolId: string | null;
    coverImageFileId: string | null;
  } | null>;

  updateImageAtomic(params: {
    courseId: string;
    ownerId: string;
    newFileId: string;
  }): Promise<{
    oldFileId: string | null;
  }>;

  softDelete(courseId: string): Promise<void>;
}
