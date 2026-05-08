export type CourseStatus = 'draft' | 'published' | 'archived';

export interface CourseSubscription {
  subscriptionId: string;
  courseId: string;
  status: 'active' | 'past_due' | 'canceled';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  plan: {
    id: string;
    name: string;
    price: number;
    features: string[];
  };
}

export interface Course {
  ownerId: string;
  id: string;
  schoolId?: string | null;

  name: string;
  description: string | null;
  coverImageUrl: string | null;
  gallery: string[] | null;

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
  onlineInstructions?: string | null;

  averageRating: number;
  enrollmentsCount: number;

  status: CourseStatus;
  isActive: boolean;

  schoolName?: string | null;
  ownerName?: string | null;

  createdAt: Date;
  updatedAt: Date;

  subscription?: CourseSubscription | null;
  categories?: { id: string; name: string; slug: string }[];
}
