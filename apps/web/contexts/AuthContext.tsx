"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { api, ApiError } from "../lib/services/api";

const AUTH_USER_ID_KEY = "skoolia:auth-user-id";

/* =========================
   TYPES
========================= */

export type AuthUser = {
  id: string;
  email: string;
  name?: string | null;
  role: "public" | "private";
  onboardingRequired: boolean;
  hasSchool?: boolean;
};

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

/* =========================
   CONTEXT
========================= */

const AuthContext = createContext<AuthContextType | null>(null);

/* =========================
   PROVIDER
========================= */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     LOAD CURRENT USER
  ========================= */

  async function refreshUser() {
    try {
      const data = await api<AuthUser>("/users/me", { retryOn401: false });
      setUser(data);
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_USER_ID_KEY, data.id);
      }
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        setUser(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(AUTH_USER_ID_KEY);
        }
      } else {
        console.error("Unexpected auth error:", err);
      }
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOGIN
  ========================= */

  async function login(email: string, password: string): Promise<AuthUser> {
    await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });

    // 🔥 después de login pedimos el user real
    const data = await api<AuthUser>("/users/me", { retryOn401: false });
    setUser(data);
    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_USER_ID_KEY, data.id);
    }
    return data;
  }

  /* =========================
     LOGOUT
  ========================= */

  async function logout() {
    const currentRole = user?.role;

    try {
      await api("/auth/logout", {
        method: "POST",
      });
    } catch {
      // aunque falle, limpiamos estado
    } finally {
      setUser(null);

      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_USER_ID_KEY);
        const audience = currentRole === "private" ? "schools" : "parents";
        window.location.replace(`/?audience=${audience}`);
      }
    }
  }

  /* =========================
     INIT (cuando carga la app)
  ========================= */

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* =========================
   HOOK
========================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
