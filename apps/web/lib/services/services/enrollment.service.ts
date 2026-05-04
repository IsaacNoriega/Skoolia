import { api } from "../api";

export enum EnrollmentTargetType {
  SCHOOL = 'SCHOOL',
  COURSE = 'COURSE',
}

export interface Enrollment {
  id: string;
  targetId: string;
  targetType: EnrollmentTargetType;
  amount: number;
  commission: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export const enrollmentService = {
  async enroll(data: {
    targetId: string;
    targetType: EnrollmentTargetType;
    amount: number;
  }) {
    return api<Enrollment>("/enrollments", {
      method: 'POST',
      body: data,
    });
  },

  async getMyEnrollments() {
    return api<Enrollment[]>("/enrollments/my");
  },

  async getByTarget(targetId: string) {
    return api<Enrollment[]>(`/enrollments/target/${targetId}`);
  }
};
