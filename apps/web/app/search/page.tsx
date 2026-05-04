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
  const q = searchParams.get("q") || "";
  const loc = searchParams.get("loc") || "";
  const level = searchParams.get("level") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const schedule = searchParams.get("schedule") || "";
  const modality = searchParams.get("modality") || "";
  const languages = searchParams.get("languages") || "";
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : undefined;
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : undefined;
  const sortBy = (searchParams.get("sortBy")?.toLowerCase() as any) || "recent";
  const verified = searchParams.get("verified") === "1";
  const near = searchParams.get("near") === "1";
  const lat = searchParams.get("lat") ? Number(searchParams.get("lat")) : undefined;
  const lon = searchParams.get("lon") ? Number(searchParams.get("lon")) : undefined;

  const filters = {
    search: q,
    city: loc,
    educationalLevel: level,
    categoryId,
    schedule,
    modality,
    languages,
    minPrice,
    maxPrice,
    sortBy,
    onlyVerified: verified,
    latitude: lat,
    longitude: lon,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <SearchToolbar 
        tab={tab} 
        q={q}
        loc={loc}
        level={level}
        categoryId={categoryId}
        schedule={schedule}
        modality={modality}
        languages={languages}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sortBy={sortBy}
        verified={verified}
        near={near}
        latitude={lat}
        longitude={lon}
      />
      <div className="mt-8">
        {tab === "cursos" ? (
          <CoursesFeed {...filters} />
        ) : (
          <SchoolsFeed {...filters} />
        )}
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
