import { api } from "../api";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: "public" | "private";
  avatarUrl?: string;
};

export const userService = {
  async getMe(): Promise<UserProfile> {
    return api<UserProfile>("/users/me", {
      method: "GET",
    });
  },

  async updateMe(data: {
    name?: string;
    email?: string;
  }): Promise<UserProfile> {
    return api<UserProfile>("/users/me", {
      method: "PATCH",
      body: data,
    });
  },

  async updateAvatar(fileId: string): Promise<UserProfile> {
    return api<UserProfile>("/users/me/image", {
      method: "PATCH",
      body: { fileId },
    });
  },
};