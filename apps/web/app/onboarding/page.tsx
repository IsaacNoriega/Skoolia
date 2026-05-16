"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { OnboardingProvider } from "../../contexts/OnBoardingContext";

// 🔥 Desactivamos SSR para evitar el error de Leaflet (window is not defined)
const OnboardingLayout = dynamic(() => import("./OnboardingLayout"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-medium">Cargando interfaz...</p>
      </div>
    </div>
  )
});

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role !== "private") {
        router.push("/");
      } else if (!user.onboardingRequired) {
        router.push(user.hasSchool ? "/schools" : "/courses");
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-lg font-medium">Validando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingProvider>
      <OnboardingLayout />
    </OnboardingProvider>
  );
}