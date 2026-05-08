"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronLeft, Search, MapPin, SlidersHorizontal, Grid3X3, MoreHorizontal, X, Check, ArrowRight, Clock, Sparkles, GraduationCap, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BudgetSlider } from "@/components/ui/BudgetSlider";
import StyledSelect from "@/components/ui/StyledSelect";
import { schoolCategoriesService, type Category } from "@/lib/services/services/schools-categories.service";
import { MEXICO_STATES, resolveMexicanState } from "@/lib/mexico-states";
import { useAuth } from "@/contexts/AuthContext";
import { COURSE_MODALITIES } from "@/lib/constants";

type Props = {
  tab?: "escuelas" | "cursos";
  q?: string;
  loc?: string;
  level?: string;
  categoryId?: string;
  schedule?: string;
  modality?: string;
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
  modality = "",
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
  const [scheduleFilter, setScheduleFilter] = useState(modality || schedule);
  const [languagesFilter, setLanguagesFilter] = useState(languages);
  const [ageRange, setAgeRange] = useState<number[]>([0, 18]);
  const [budgetRange, setBudgetRange] = useState<number[]>([minPrice ?? 1000, maxPrice ?? 20000]);
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
  useEffect(() => setScheduleFilter(modality || schedule), [modality, schedule]);
  useEffect(() => setLanguagesFilter(languages), [languages]);
  useEffect(() => setBudgetRange([minPrice ?? 1000, maxPrice ?? 20000]), [minPrice, maxPrice]);
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

    if (normalizedQuery) params.set("q", normalizedQuery);
    if (normalizedLoc && normalizedLoc !== ALL_ZONES_LABEL && normalizedLoc !== "Cerca de mí") {
      const normalizedState = resolveMexicanState(normalizedLoc);
      if (normalizedState) {
        params.set("loc", normalizedState);
      }
    }
    if (normalizedLevel) params.set("level", normalizedLevel);
    if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
    if (normalizedSchedule) params.set("modality", normalizedSchedule);
    if (normalizedLanguages) params.set("languages", normalizedLanguages);
    if (ageRange[0] > 0) params.set("minAge", String(ageRange[0]));
    if (ageRange[1] < 18) params.set("maxAge", String(ageRange[1]));
    if (budgetRange[0] > 1000) params.set("minPrice", String(budgetRange[0]));
    if (budgetRange[1] < 20000) params.set("maxPrice", String(budgetRange[1]));
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
              <StyledSelect
                value={location}
                onChange={(val) => {
                  setLocation(val);
                  setNearMe(val === "Cerca de mí");
                }}
                options={[ALL_ZONES_LABEL, "Cerca de mí", ...MEXICO_STATES]}
                placeholder="¿Dónde?"
                variant="minimal"
                showSearch
              />
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
                      <StyledSelect
                        value={scheduleFilter}
                        onChange={setScheduleFilter}
                        options={COURSE_MODALITIES}
                        placeholder="Todas las modalidades"
                        variant="outline"
                        triggerClassName="w-full"
                      />
                    </FilterGroup>

                    <FilterGroup label="Fecha sugerida" icon={<Clock size={14} />}>
                      <input
                        type="date"
                        value={languagesFilter}
                        onChange={(e) => setLanguagesFilter(e.target.value)}
                        className="w-full h-14 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-200 px-6 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-violet-200 transition-all"
                      />
                    </FilterGroup>

                    <FilterGroup label="Presupuesto máximo" icon={<Sparkles size={14} />}>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                        <input
                          type="number"
                          value={budgetRange[1]}
                          onChange={(e) => setBudgetRange([budgetRange[0], Number(e.target.value) || 20000])}
                          placeholder="Ej. 15,000"
                          className="w-full rounded-2xl bg-slate-50 border-2 border-slate-50 pl-8 pr-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-100 focus:bg-white transition-all"
                        />
                      </div>
                    </FilterGroup>

                    <FilterGroup label="Idioma" icon={<GraduationCap size={14} />}>
                      <StyledSelect
                        value={educationalLevel}
                        onChange={setEducationalLevel}
                        options={["Español", "Inglés", "Francés", "Trilingüe"]}
                        placeholder="Todos los idiomas"
                        variant="outline"
                        triggerClassName="w-full"
                      />
                    </FilterGroup>
                  </>
                ) : (
                  <>
                    <FilterGroup label="Nivel Educativo" icon={<GraduationCap size={14} />}>
                      <StyledSelect
                        value={educationalLevel}
                        onChange={setEducationalLevel}
                        options={["Maternal", "Preescolar", "Primaria", "Secundaria", "Preparatoria", "Universidad"]}
                        placeholder="Todos los niveles"
                        variant="outline"
                        triggerClassName="w-full"
                      />
                    </FilterGroup>

                    <FilterGroup label="Categoría" icon={<Grid3X3 size={14} />}>
                      <StyledSelect
                        value={categories.find(c => c.id === selectedCategoryId)?.name || ""}
                        onChange={(val) => {
                          const cat = categories.find(c => c.name === val);
                          if (cat) setSelectedCategoryId(cat.id);
                        }}
                        options={categories.map(c => c.name)}
                        placeholder="Todas las categorías"
                        variant="outline"
                        triggerClassName="w-full"
                        showSearch
                      />
                    </FilterGroup>

                    <FilterGroup label="Edad del Estudiante" icon={<GraduationCap size={14} />}>
                      <div className="flex flex-col gap-4 pt-2">
                        <BudgetSlider
                          value={ageRange}
                          onValueChange={setAgeRange}
                          min={0}
                          max={18}
                          step={1}
                        />
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>{ageRange[0]} años</span>
                          <span>{ageRange[1]} años</span>
                        </div>
                      </div>
                    </FilterGroup>

                    <FilterGroup label="Presupuesto Mensual" icon={<Sparkles size={14} />}>
                      <div className="flex flex-col gap-4 pt-2">
                        <BudgetSlider
                          value={budgetRange}
                          onValueChange={setBudgetRange}
                          min={1000}
                          max={20000}
                          step={500}
                        />
                        <div className="flex justify-between text-xs font-bold text-slate-500">
                          <span>${budgetRange[0].toLocaleString()}</span>
                          <span>${budgetRange[1].toLocaleString()}{budgetRange[1] >= 20000 ? '+' : ''}</span>
                        </div>
                      </div>
                    </FilterGroup>

                    <FilterGroup label="Idiomas" icon={<MessageSquare size={14} />}>
                      <StyledSelect
                        value={languagesFilter}
                        onChange={setLanguagesFilter}
                        options={["Español", "Inglés", "Francés", "Trilingüe"]}
                        placeholder="Cualquier idioma"
                        variant="outline"
                        triggerClassName="w-full"
                      />
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
                    setAgeRange([0, 18]);
                    setSelectedCategoryId("");
                    setScheduleFilter("");
                    setLanguagesFilter("");
                    setBudgetRange([1000, 20000]);
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


