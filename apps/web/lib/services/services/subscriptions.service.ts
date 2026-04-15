import { api } from "../api";

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
}

export interface SchoolSubscription {
  subscriptionId: string;
  schoolId: string;
  status: "active" | "past_due" | "canceled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  plan: SubscriptionPlan;
}

export interface UpgradeToPremiumResponse {
  message: string;
  subscription: SchoolSubscription;
}

export const subscriptionsService = {
  async upgradeToPremium(token?: string) {
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined;

    return api<UpgradeToPremiumResponse>("/subscriptions/upgrade", {
      method: "PATCH",
      headers,
    });
  },
};
