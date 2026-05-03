"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Search, MapPin, SlidersHorizontal, Grid3X3, MoreHorizontal, X, Check, ArrowRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { schoolCategoriesService, type Category } from "@/lib/services/services/schools-categories.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
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
    router.push(`${pathname}?${params.toString()}`);
  };
  const activeColor = activeTab === "cursos" ? "violet" : "indigo";
  const activeColorClass = activeTab === "cursos" ? "text-violet-600" : "text-indigo-600";
  const activeBgClass = activeTab === "cursos" ? "bg-violet-600" : "bg-indigo-600";
  const activeBorderClass = activeTab === "cursos" ? "focus-within:border-violet-500" : "focus-within:border-indigo-500";

  return (
    <div className="mx-auto max-w-7xl px-6 pt-10 pb-12">
      {/* Search Header */}
      <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div>
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => {
              if (user?.role === 'public') {
                router.push('/parents');
              } else {
                router.push('/');
              }
            }}
            className="group mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition hover:text-slate-900"
          >
            <ChevronLeft size={14} className="transition-transform" />
            Volver al inicio
          </motion.button>
          <h1 className="text-4xl font-black tracking-tighter text-slate-900 sm:text-5xl lg:text-6xl">
            {activeTab === "cursos" ? "Explora " : "Encuentra "}
            <span className={activeColorClass}>
              {activeTab === "cursos" ? "cursos" : "escuelas"}
            </span>
          </h1>
          <p className="mt-3 text-slate-500 font-medium max-w-md">
            Descubre las mejores opciones educativas personalizadas para tu familia.
          </p>
        </div>

        <div className="flex rounded-[1.5rem] bg-slate-100 p-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab("escuelas")}
            className={`rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "escuelas" ? "bg-white text-indigo-600 shadow-xl shadow-indigo-100" : "text-slate-400 hover:text-slate-600"}`}
          >
            Escuelas
          </button>
          <button
            onClick={() => setActiveTab("cursos")}
            className={`rounded-xl px-6 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === "cursos" ? "bg-white text-violet-600 shadow-xl shadow-violet-100" : "text-slate-400 hover:text-slate-600"}`}
          >
            Cursos
          </button>
        </div>
      </div>

      {/* Unified Search Pill */}
      <div className="relative z-20 mx-auto w-full max-w-5xl">
        <div className={`flex flex-col gap-4 rounded-[2.5rem] border-2 border-slate-50 bg-white p-3 shadow-2xl shadow-indigo-100/50 transition-all ${activeBorderClass} md:flex-row md:items-center md:gap-0`}>
          
          {/* Query */}
          <div className="flex flex-1 items-center gap-4 px-6 py-3 md:py-1">
            <Search size={22} className="text-slate-300" />
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">¿Qué buscas?</span>
              <input
                className="w-full bg-transparent text-base font-bold text-slate-900 placeholder:text-slate-200 outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void applyFilters();
                }}
                placeholder={activeTab === "cursos" ? "Yoga, Piano, Inglés..." : "Primaria, Bilingüe, Montessori..."}
              />
            </div>
          </div>

          <div className="hidden h-12 w-px bg-slate-100 md:block" />

          {/* Location */}
          <div className="flex flex-1 items-center gap-4 px-6 py-3 md:py-1">
            <MapPin size={22} className="text-slate-300" />
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">¿Dónde?</span>
              <div className="relative">
                <select
                  value={location}
                  onChange={(e) => {
                    const value = e.target.value;
                    setLocation(value);
                    setNearMe(value === "Cerca de mí");
                  }}
                  className="w-full appearance-none bg-transparent text-base font-bold text-slate-900 outline-none cursor-pointer pr-8"
                >
                  <option value={ALL_ZONES_LABEL}>{ALL_ZONES_LABEL}</option>
                  <option value="Cerca de mí">📍 Cerca de mí</option>
                  {MEXICO_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center">
                  <MoreHorizontal size={14} className="text-slate-300 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="hidden h-12 w-px bg-slate-100 md:block" />

          {/* Filters Toggle & Search Button */}
          <div className="flex items-center gap-3 px-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAdvanced((prev) => !prev)}
              className={`flex h-14 w-14 items-center justify-center rounded-full transition-all ${showAdvanced ? `${activeBgClass} text-white shadow-lg shadow-${activeColor}-200` : "bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
            >
              {showAdvanced ? <X size={20} /> : <SlidersHorizontal size={20} />}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => void applyFilters()}
              disabled={geoLoading}
              className={`flex h-14 min-w-[140px] px-8 items-center justify-center rounded-full text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all ${geoLoading ? "bg-slate-200 cursor-wait" : `${activeBgClass} hover:shadow-2xl shadow-${activeColor}-200`}`}
            >
              {geoLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Buscar
                  <ArrowRight size={16} className="ml-2" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 rounded-[2.5rem] bg-white p-8 shadow-2xl shadow-slate-200/40 border border-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {activeTab === "cursos" ? (
                  <>
                    <FilterGroup label="Modalidad" icon={<Grid3X3 size={14} />}>
                      <select
                        value={scheduleFilter}
                        onChange={(e) => setScheduleFilter(e.target.value)}
                        className="w-full appearance-none rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-100 focus:bg-white transition-all"
                      >
                        <option value="">Todas las modalidades</option>
                        <option value="Presencial">Presencial</option>
                        <option value="En línea">En línea</option>
                        <option value="Híbrido">Híbrido</option>
                      </select>
                    </FilterGroup>

                    <FilterGroup label="Fecha sugerida" icon={<Clock size={14} />}>
                      <input
                        type="date"
                        value={languagesFilter}
                        onChange={(e) => setLanguagesFilter(e.target.value)}
                        className="w-full rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-100 focus:bg-white transition-all"
                      />
                    </FilterGroup>

                    <FilterGroup label="Presupuesto máximo" icon={<Sparkles size={14} />}>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          value={priceMax}
                          onChange={(e) => setPriceMax(e.target.value)}
                          placeholder="Ej. 15,000"
                          className="w-full rounded-2xl bg-slate-50 border-2 border-slate-50 pl-8 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-100 focus:bg-white transition-all"
                        />
                      </div>
                    </FilterGroup>

                    <FilterGroup label="Idioma" icon={<GraduationCap size={14} />}>
                      <select
                        value={educationalLevel}
                        onChange={(e) => setEducationalLevel(e.target.value)}
                        className="w-full appearance-none rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-100 focus:bg-white transition-all"
                      >
                        <option value="">Todos los idiomas</option>
                        <option value="Español">Español</option>
                        <option value="Inglés">Inglés</option>
                        <option value="Francés">Francés</option>
                        <option value="Trilingüe">Trilingüe</option>
                      </select>
                    </FilterGroup>
                  </>
                ) : (
                  <>
                    <FilterGroup label="Nivel Educativo" icon={<GraduationCap size={14} />}>
                      <select
                        value={educationalLevel}
                        onChange={(e) => setEducationalLevel(e.target.value)}
                        className="w-full appearance-none rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                      >
                        <option value="">Todos los niveles</option>
                        <option value="Maternal">Maternal</option>
                        <option value="Preescolar">Preescolar</option>
                        <option value="Primaria">Primaria</option>
                        <option value="Secundaria">Secundaria</option>
                        <option value="Preparatoria">Preparatoria</option>
                        <option value="Universidad">Universidad</option>
                      </select>
                    </FilterGroup>

                    <FilterGroup label="Categoría" icon={<Grid3X3 size={14} />}>
                      <select
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full appearance-none rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                      >
                        <option value="">Todas las categorías</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </FilterGroup>

                    <FilterGroup label="Rango de Precio" icon={<Sparkles size={14} />}>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            value={priceMin}
                            onChange={(e) => setPriceMin(e.target.value)}
                            placeholder="Mín"
                            className="w-full rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                          />
                        </div>
                        <span className="text-slate-300">—</span>
                        <div className="relative flex-1">
                          <input
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            placeholder="Máx"
                            className="w-full rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                          />
                        </div>
                      </div>
                    </FilterGroup>

                    <FilterGroup label="Idiomas" icon={<MessageSquare size={14} />}>
                      <select
                        value={languagesFilter}
                        onChange={(e) => setLanguagesFilter(e.target.value)}
                        className="w-full appearance-none rounded-2xl bg-slate-50 border-2 border-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-indigo-100 focus:bg-white transition-all"
                      >
                        <option value="">Cualquier idioma</option>
                        <option value="Español">Español</option>
                        <option value="Inglés">Inglés</option>
                        <option value="Francés">Francés</option>
                        <option value="Trilingüe">Trilingüe</option>
                      </select>
                    </FilterGroup>

                    <div className="flex items-end pb-1">
                      <button
                        onClick={() => setOnlyVerified(!onlyVerified)}
                        className={`flex items-center gap-3 w-full rounded-2xl border-2 px-6 py-3 transition-all ${onlyVerified ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-slate-50 bg-slate-50 text-slate-400 hover:bg-slate-100"}`}
                      >
                        <div className={`flex h-5 w-5 items-center justify-center rounded-lg border-2 ${onlyVerified ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300"}`}>
                          {onlyVerified && <Check size={14} />}
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Solo verificados</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end gap-3">
                <button 
                  onClick={() => {
                    setEducationalLevel("");
                    setSelectedCategoryId("");
                    setScheduleFilter("");
                    setLanguagesFilter("");
                    setPriceMin("");
                    setPriceMax("");
                    setOnlyVerified(false);
                  }}
                  className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Limpiar Filtros
                </button>
                <button 
                  onClick={() => void applyFilters()}
                  className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all ${activeBgClass} hover:opacity-90 shadow-${activeColor}-100`}
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterGroup({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
        <span className="opacity-60">{icon}</span>
        {label}
      </span>
      {children}
    </div>
  );
}

function MessageSquare({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GraduationCap({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c3 3 9 3 12 0v-5" />
    </svg>
  );
}

function Sparkles({ size }: { size: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3 4 5 2 6l2 1 1 2 1-2 2-1-2-1-1-2Z" />
      <path d="M20 18l-1 2-2 1 2 1 1 2 1-2 2-1-2-1-1-2Z" />
    </svg>
  );
}
