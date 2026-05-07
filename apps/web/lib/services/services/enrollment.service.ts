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
  },

  async getMyMetrics() {
    const response = await api<{
      qualifiedLeads: number;
      leadsFee: string;
      successCommissions: string;
      totalToPay: string;
      conversionRate: string;
    }>("/enrollments/my-metrics");
    return response;
  },

  async triggerAutomatedFollowUp(targetId: string, type: EnrollmentTargetType) {
    return api<{ success: boolean; message: string; followUpCount: number }>(`/enrollments/trigger-followup`, {
      method: 'POST',
      body: { targetId, type },
    });
  }
};
