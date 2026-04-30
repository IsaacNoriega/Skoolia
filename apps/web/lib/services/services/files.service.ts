// src/services/files.service.ts

import { ApiError } from "../api";

const API_BASE_URL =
  typeof window === 'undefined'
    ? process.env.API_SERVER_URL ??
      process.env.NEXT_PUBLIC_API_URL ??
      'http://localhost:8000'
    : process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export interface FileObject {
  id: string;
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  ownerId: string;
  ownerType: 'school' | 'course' | 'student' | 'user';
  createdAt: string;
}

export const filesService = {
  async upload(file: File): Promise<FileObject> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/files/upload`, {
      method: 'POST',
      credentials: 'include', // 🔥 importante para httponly
      body: formData,
    });

    if (!res.ok) {
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
      throw new ApiError('Upload failed', res.status, data);
    }

    return res.json();
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/files/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!res.ok) {
      let data: unknown;
      try {
        data = await res.json();
      } catch {
        data = undefined;
      }
      throw new ApiError('Delete failed', res.status, data);
    }
  },
};
