// src/services/favorites.service.ts
import { api } from "../api";

export const favoritesService = {
  async toggle(schoolId: string) {
    return api<{ isFavorite: boolean }>(
      `/favorites/${schoolId}`,
      { method: 'POST' }
    );
  },
  async listForMe() {
    return api<Array<{
      id: string;
      name: string;
      coverImageUrl: string | null;
      city: string | null;
      monthlyPrice: number | null;
    }>>('/favorites');
  },
  async isFavorite(schoolId: string) {
    return api<{ isFavorite: boolean }>(`/favorites/${schoolId}/check`);
  },
};