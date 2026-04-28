import { api } from "../api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  features: string[];
}

export interface SchoolActivePlan {
  subscriptionId: string;
  schoolId: string;
  status: "active" | "past_due" | "canceled";
  startDate: string;
  endDate: string;
  plan: SubscriptionPlan;
}

export interface ChangePlanResponse {
  message: string;
  subscription: SchoolActivePlan;
}

export const subscriptionsService = {
  async getActivePlan(token?: string) {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : undefined;
    return api<SchoolActivePlan | null>("/subscriptions/me", { headers });
  },

  async changePlan(planId: string, token?: string) {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : undefined;

    return api<ChangePlanResponse>("/subscriptions/change", {
      method: "PATCH",
      headers,
      body: JSON.stringify({ planId }),
    });
  },
};
