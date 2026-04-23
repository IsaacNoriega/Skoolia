"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SchoolsFeed from "@/components/search/SchoolsFeed";
import CoursesFeed from "@/components/search/CoursesFeed";
import SearchToolbar from "@/components/search/SearchToolbar";
import { useAuth } from "@/contexts/AuthContext";

function SearchContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "escuelas";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SearchToolbar tab={tab} />
      <div className="mt-8">
        {tab === "cursos" ? <CoursesFeed /> : <SchoolsFeed />}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-10">Cargando buscador...</div>}>
      <SearchContent />
    </Suspense>
  );
}
