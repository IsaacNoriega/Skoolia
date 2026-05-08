// src/services/schools.service.ts
import { api } from "../api";

export interface School {
  id: string;

  name: string;
  description: string | null;

  // 🖼 imágenes
  logoUrl: string | null;
  coverImageUrl: string | null;
  gallery: string[] | null;

  // 📍 ubicación
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;

  // 🎓 info académica
  educationalLevel: string | null;
  institutionType: string | null;
  schedule: string | null;
  languages: string | null;
  maxStudentsPerClass: number | null;
  enrollmentYear: number | null;
  enrollmentOpen: boolean;

  // 💰 precios
  monthlyPrice: number | null;

  // ⭐ métricas
  averageRating: number;
  ratingsCount: number;
  favoritesCount: number;
  rankingScore: number;

  // 🏅 flags
  isFeatured: boolean;
  isVerified: boolean;

  ownerId: string;
  categories?: { id: string; name: string; slug: string }[];

  createdAt: string;
  updatedAt: string;
}

export const schoolsService = {
  async create(data: {
    name: string;
    description?: string;
  }) {
    return api<School>("/schools", {
      method: "POST",
      body: data,
    });
  },

  async getMySchool() {
    return api<School>("/schools/me");
  },

  async getById(id: string) {
    return api<School>(`/schools/${id}`);
  },

  async update(data: any) {
    return api<School>("/schools", {
      method: "PATCH",
      body: data,
    });
  },

  async updateImage(field: "logoUrl" | "coverImageUrl", fileId: string) {
    return api<School>(`/schools/me/image/${field}`, {
      method: "PATCH",
      body: { fileId },
    });
  },

  async getNearbySchools(lat: number, lng: number, radius = 10) {
    return api<School[]>(`/schools/nearby/${lat}/${lng}`);
  },
};
