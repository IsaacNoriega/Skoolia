import { api } from "../api";

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: "monthly" | "yearly";
  features: string[];
}

export const plansService = {
  async getAll(): Promise<Plan[]> {
    return api<Plan[]>("/plans");
  },
};
