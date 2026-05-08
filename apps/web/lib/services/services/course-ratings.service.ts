import { api } from "../api";

export interface CourseRating {
  id: string;
  courseId: string;
  publicUserId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
  userName?: string;
  userAvatar?: string;
}

export const courseRatingsService = {
  async upsert(params: {
    courseId: string;
    rating: number;
    comment?: string;
  }): Promise<CourseRating> {
    return api<CourseRating>(`/courses/${params.courseId}/ratings`, {
      method: 'POST',
      body: {
        rating: params.rating,
        comment: params.comment,
      },
    });
  },

  async list(params: {
    courseId: string;
    page?: number;
    pageSize?: number;
  }): Promise<CourseRating[]> {
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const query = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });

    return api<CourseRating[]>(`/courses/${params.courseId}/ratings?${query.toString()}`);
  },
};
