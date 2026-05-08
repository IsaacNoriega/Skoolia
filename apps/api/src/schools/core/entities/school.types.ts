export interface School {
  id: string;
  name: string;
  description: string | null;

  logoUrl: string | null;
  coverImageUrl: string | null;
  gallery: string[] | null;


  address: string | null;
  city: string | null;
  state: string | null;
  latitude: number | null;
  longitude: number | null;

  educationalLevel: string | null;
  institutionType: string | null;
  schedule: string | null;
  languages: string | null;

  maxStudentsPerClass: number | null;
  enrollmentYear: number | null;
  enrollmentOpen: boolean | null;

  monthlyPrice: number | null;

  averageRating: number;
  ratingsCount: number;
  favoritesCount: number;
  rankingScore: number;

  isFeatured: boolean;
  isVerified: boolean;

  ownerId: string;
  categories?: { id: string; name: string; slug: string }[];

  createdAt: Date;
  updatedAt: Date;
}

export type SchoolImageField = 'logoUrl' | 'coverImageUrl';
