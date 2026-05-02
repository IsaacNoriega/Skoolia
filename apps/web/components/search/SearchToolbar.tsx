"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Search, MapPin, SlidersHorizontal, Grid3X3, MoreHorizontal } from "lucide-react";
import { schoolCategoriesService, type Category } from "@/lib/services/services/schools-categories.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";

type Props = {
  tab?: "escuelas" | "cursos";
  q?: string;
  loc?: string;
  level?: string;
  categoryId?: string;
  schedule?: string;
  languages?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: "favorites" | "rating" | "recent";
  verified?: boolean;
  near?: boolean;
  latitude?: number;
  longitude?: number;
};

const ALL_ZONES_LABEL = "México (Todas las zonas)";

export default function SearchToolbar({
  tab = "escuelas",
  q = "",
  loc = ALL_ZONES_LABEL,
  level = "",
  categoryId = "",
  schedule = "",
  languages = "",
  minPrice,
  maxPrice,
  sortBy = "recent",
  verified = false,
  near = false,
  latitude,
  longitude,
}: Props) {
    const [activeTab, setActiveTab] = useState<"escuelas" | "cursos">(
      tab || "escuelas"
    );
    useEffect(() => {
      setActiveTab(tab || "escuelas");
    }, [tab]);
  const router = useRouter();
  const pathname = usePathname();

  const [query, setQuery] = useState(q);
  const [location, setLocation] = useState(loc);
  const [educationalLevel, setEducationalLevel] = useState(level);
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId);
  const [scheduleFilter, setScheduleFilter] = useState(schedule);
  const [languagesFilter, setLanguagesFilter] = useState(languages);
  const [priceMin, setPriceMin] = useState(minPrice != null ? String(minPrice) : "");
  const [priceMax, setPriceMax] = useState(maxPrice != null ? String(maxPrice) : "");
  const [sort, setSort] = useState<"favorites" | "rating" | "recent">(sortBy);
  const [onlyVerified, setOnlyVerified] = useState(verified);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nearMe, setNearMe] = useState(near || loc === "Cerca de mí");
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(
    latitude != null && longitude != null ? { latitude, longitude } : null,
  );
  const [nearState, setNearState] = useState<string | null>(near ? (loc || null) : null);
  const [geoLoading, setGeoLoading] = useState(false);
  const isKnownState = MEXICO_STATES.some((state) => state === location);

  useEffect(() => setQuery(q), [q]);
  useEffect(() => setLocation(loc), [loc]);
  useEffect(() => setEducationalLevel(level), [level]);
  useEffect(() => setSelectedCategoryId(categoryId), [categoryId]);
  useEffect(() => setScheduleFilter(schedule), [schedule]);
  useEffect(() => setLanguagesFilter(languages), [languages]);
  useEffect(() => setPriceMin(minPrice != null ? String(minPrice) : ""), [minPrice]);
  useEffect(() => setPriceMax(maxPrice != null ? String(maxPrice) : ""), [maxPrice]);
  useEffect(() => setSort(sortBy), [sortBy]);
  useEffect(() => setOnlyVerified(verified), [verified]);
  useEffect(() => setNearMe(near || loc === "Cerca de mí"), [near, loc]);
  useEffect(() => {
    if (near && loc && loc !== "Cerca de mí") {
      setNearState(loc);
    }
  }, [near, loc]);
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setCoords({ latitude, longitude });
    }
  }, [latitude, longitude]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await schoolCategoriesService.getAllCategories();
        if (!active) return;
        setCategories(data);
      } catch {
        if (!active) return;
        setCategories([]);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const requestCurrentPosition = () =>
    new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      if (typeof window === "undefined" || !("geolocation" in navigator)) {
        reject(new Error("Geolocation API no disponible"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => reject(new Error("Permiso de ubicación denegado")),
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 1000 * 60 * 15,
        },
      );
    });

  const resolveStateFromCoords = async (lat: number, lon: number): Promise<string | undefined> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) return undefined;

      const data = (await response.json()) as {
        address?: {
          state?: string;
          region?: string;
          state_district?: string;
        };
      };

      const stateName =
        data.address?.state || data.address?.region || data.address?.state_district;

      return stateName?.trim() || undefined;
    } catch {
      return undefined;
    }
  };

  const applyFilters = async () => {
    const params = new URLSearchParams();
    const normalizedLoc = location.trim();
    const normalizedQuery = query.trim();
    const normalizedLevel = educationalLevel.trim();
    const normalizedSchedule = scheduleFilter.trim();
    const normalizedLanguages = languagesFilter.trim();
    const normalizedMinPrice = priceMin.trim();
    const normalizedMaxPrice = priceMax.trim();

    if (normalizedQuery) params.set("q", normalizedQuery);
    if (normalizedLoc && normalizedLoc !== ALL_ZONES_LABEL && normalizedLoc !== "Cerca de mí") {
      const normalizedState = resolveMexicanState(normalizedLoc);
      if (normalizedState) {
        params.set("loc", normalizedState);
      }
    }
    if (normalizedLevel) params.set("level", normalizedLevel);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (normalizedSchedule) params.set("schedule", normalizedSchedule);
    if (normalizedLanguages) params.set("languages", normalizedLanguages);
    if (normalizedMinPrice && !Number.isNaN(Number(normalizedMinPrice))) {
      params.set("minPrice", normalizedMinPrice);
    }
    if (normalizedMaxPrice && !Number.isNaN(Number(normalizedMaxPrice))) {
      params.set("maxPrice", normalizedMaxPrice);
    }
    if (sort !== "recent") params.set("sortBy", sort);
    if (onlyVerified) params.set("verified", "1");

    if (nearMe || normalizedLoc === "Cerca de mí") {
      let currentCoords = coords;
      if (!currentCoords) {
        try {
          setGeoLoading(true);
          currentCoords = await requestCurrentPosition();
          setCoords(currentCoords);
        } catch {
          setGeoLoading(false);
          return;
        } finally {
          setGeoLoading(false);
        }
      }

      if (currentCoords) {
        const resolvedState = resolveMexicanState(
          nearState ||
            (await resolveStateFromCoords(currentCoords.latitude, currentCoords.longitude)),
        );

        if (resolvedState) {
          setNearState(resolvedState);
          setLocation(resolvedState);
        }

        params.set("near", "1");
        params.set("lat", String(currentCoords.latitude));
        params.set("lon", String(currentCoords.longitude));
        params.set("loc", resolvedState || "Cerca de mí");
      }
    }

    params.set("tab", activeTab);
  // Selector visual de tab
  // Puedes ajustar el estilo según tu diseño
  // ---
  // Botones para cambiar entre escuelas y cursos
  // ---
  // Puedes mover esto donde prefieras en el layout
  // ---
  // Ejemplo simple:
  //
  // <div className="flex gap-2 mb-4">
  //   <button
  //     className={`px-4 py-2 rounded-full font-bold ${activeTab === "escuelas" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
  //     onClick={() => setActiveTab("escuelas")}
  //   >
  //     Escuelas
  //   </button>
  //   <button
  //     className={`px-4 py-2 rounded-full font-bold ${activeTab === "cursos" ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-700"}`}
  //     onClick={() => setActiveTab("cursos")}
  //   >
  //     Cursos
  //   </button>
  // </div>

    router.push(`${pathname}?${params.toString()}`);
  };
  return (
    <div className="mx-auto max-w-7xl px-6 pt-10">
      {/* Search Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="group mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-900"
          >
            <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Volver
          </button>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {activeTab === "cursos" ? "Explora cursos" : "Encuentra escuelas"}
          </h1>
        </div>

        <div className="flex rounded-2xl bg-slate-100 p-1">
          <button
            onClick={() => setActiveTab("escuelas")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "escuelas" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Escuelas
          </button>
          <button
            onClick={() => setActiveTab("cursos")}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${activeTab === "cursos" ? "bg-white text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            Cursos
          </button>
        </div>
      </div>

      {/* Unified Search Pill */}
      <div className="relative z-10 mx-auto w-full max-w-4xl">
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm transition-all focus-within:border-slate-300 sm:flex-row sm:items-center sm:gap-0 sm:rounded-full">
          
          {/* Query */}
          <div className="flex flex-1 items-center gap-3 px-4 py-2 sm:px-6">
            <Search size={18} className="text-slate-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">¿Qué buscas?</span>
              <input
                className="w-full bg-transparent text-sm font-medium text-slate-900 placeholder:text-slate-300 outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void applyFilters();
                }}
                placeholder={activeTab === "cursos" ? "Yoga, Inglés..." : "Primaria, Bilingüe..."}
              />
            </div>
          </div>

          <div className="hidden h-8 w-px bg-slate-50 sm:block" />

          {/* Location */}
          <div className="flex flex-1 items-center gap-3 px-4 py-2 sm:px-6">
            <MapPin size={18} className="text-slate-400" />
            <div className="flex flex-1 flex-col">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">¿Dónde?</span>
              <select
                value={location}
                onChange={(e) => {
                  const value = e.target.value;
                  setLocation(value);
                  setNearMe(value === "Cerca de mí");
                }}
                className="w-full appearance-none bg-transparent text-sm font-medium text-slate-900 outline-none cursor-pointer"
              >
                <option value={ALL_ZONES_LABEL}>{ALL_ZONES_LABEL}</option>
                <option value="Cerca de mí">📍 Cerca de mí</option>
                {MEXICO_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-slate-50 sm:block" />

          {/* Filters Toggle */}
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${showAdvanced ? "bg-slate-50 text-slate-900" : "text-slate-400 hover:text-slate-900"}`}
              title="Filtros"
            >
              <SlidersHorizontal size={18} />
            </button>

            <button
              onClick={() => void applyFilters()}
              disabled={geoLoading}
              className={`flex h-12 px-8 items-center justify-center rounded-full text-white font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95 ${geoLoading ? "bg-slate-200" : "bg-slate-900 hover:bg-black"}`}
            >
              {geoLoading ? "..." : "Buscar"}
            </button>
          </div>
        </div>
      </div>

      {showAdvanced ? (
        <div className="mt-3 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
          {activeTab === "cursos" ? (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Modalidad
                <select
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todas</option>
                  <option value="Presencial">Presencial</option>
                  <option value="En línea">En línea</option>
                  <option value="Híbrido">Híbrido</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Fecha de inicio
                <input
                  type="date"
                  value={languagesFilter}
                  onChange={(e) => setLanguagesFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Capacidad mínima
                <input
                  type="number"
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Ej. 10"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Precio máximo
                <input
                  type="number"
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Ej. 15000"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Idioma
                <select
                  value={educationalLevel}
                  onChange={(e) => setEducationalLevel(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todos</option>
                  <option value="Español">Español</option>
                  <option value="Inglés">Inglés</option>
                  <option value="Francés">Francés</option>
                  <option value="Trilingüe">Trilingüe</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Nivel educativo
                <select
                  value={educationalLevel}
                  onChange={(e) => setEducationalLevel(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todos</option>
                  <option value="Maternal">Maternal</option>
                  <option value="Preescolar">Preescolar</option>
                  <option value="Primaria">Primaria</option>
                  <option value="Secundaria">Secundaria</option>
                  <option value="Preparatoria">Preparatoria</option>
                  <option value="Universidad">Universidad</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Categoría
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Horario
                <select
                  value={scheduleFilter}
                  onChange={(e) => setScheduleFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todos</option>
                  <option value="7:30 AM">7:30 AM</option>
                  <option value="8:00 AM">8:00 AM</option>
                  <option value="8:30 AM">8:30 AM</option>
                  <option value="9:00 AM">9:00 AM</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Idioma
                <select
                  value={languagesFilter}
                  onChange={(e) => setLanguagesFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                >
                  <option value="">Todos</option>
                  <option value="Español">Español</option>
                  <option value="Inglés">Inglés</option>
                  <option value="Francés">Francés</option>
                  <option value="Trilingüe">Trilingüe</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Precio mínimo
                <input
                  value={priceMin}
                  onChange={(e) => setPriceMin(e.target.value)}
                  placeholder="Ej. 5000"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
                Precio máximo
                <input
                  value={priceMax}
                  onChange={(e) => setPriceMax(e.target.value)}
                  placeholder="Ej. 15000"
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
                />
              </label>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
