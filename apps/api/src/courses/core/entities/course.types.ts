export type CourseStatus = 'draft' | 'published' | 'archived';

export interface Course {
  id: string;
  schoolId?: string | null;

  name: string;
  description: string | null;
  coverImageUrl: string | null;

  price: number | null;
  capacity: number | null;

  startDate: Date | null;
  endDate: Date | null;

  modality: string | null;

  averageRating: number;
  enrollmentsCount: number;

  status: CourseStatus;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
