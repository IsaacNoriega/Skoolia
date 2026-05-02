// src/services/courses.service.ts
// src/services/courses.service.ts
import { api } from "../api";

export interface Course {
  id: string;
  name: string;
  description?: string | null;
  coverImageUrl?: string | null;
  price: number;
  capacity?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  modality?: string | null;
  status: 'draft' | 'published' | 'archived';
  isActive: boolean;
  schoolName?: string | null;
  ownerName?: string | null;
}

export const coursesService = {
  async listAll() {
    // Ajusta el endpoint según tu backend, aquí se asume /courses devuelve todos los cursos públicos
    return api<Course[]>("/courses");
  },
  async listBySchoolId(schoolId: string) {
    return api<Course[]>(`/courses/schools/${schoolId}`);
  },

  async listMine() {
    return api<Course[]>('/courses/me');
  },

  async create(data: {
    name: string;
    description?: string;
    coverImageUrl?: string;
    price: number;
    capacity?: number;
    startDate?: string;
    endDate?: string;
    modality?: string;
  }) {
    return api<Course>('/courses', {
      method: 'POST',
      body: data,
    });
  },

  async update(courseId: string, data: Partial<Course>) {
    return api<Course>(`/courses/${courseId}`, {
      method: 'PATCH',
      body: data,
    });
  },

  async delete(courseId: string) {
    return api<void>(`/courses/${courseId}`, {
      method: 'DELETE',
    });
  },
  async getById(courseId: string) {
    return api<Course>(`/courses/${courseId}`);
  },
  async toggleFavorite(courseId: string) {
    return api<{ isFavorite: boolean }>(
      `/courses/${courseId}/favorite`,
      { method: 'POST' }
    );
  },
  async listFavoritesForMe() {
    // Si implementas endpoint para listar favoritos de cursos
    return api<Course[]>(`/courses/favorites/me`);
  },
};