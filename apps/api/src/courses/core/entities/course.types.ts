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

  // Ubicación (solo si modality es presencial o híbrido)
  address?: string | null;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  averageRating: number;
  enrollmentsCount: number;

  status: CourseStatus;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}
