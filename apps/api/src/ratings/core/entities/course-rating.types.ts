export type CourseRating = {
  id: string;
  courseId: string;
  publicUserId: string;
  rating: number; // 1-5
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  userName?: string;
  userAvatar?: string;
};
