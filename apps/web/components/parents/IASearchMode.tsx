/**
 * =============================================================================
 * 📍 COMPONENT: AI-POWERED SCHOOL SEARCH MODAL
 * =============================================================================
 * File: IASearchMode.tsx
 * Type: Client Component (Full-screen overlay modal)
 * 
 * Purpose:
 *   Interactive AI search interface for parents to find schools
 *   Powered by Google Gemini with local database + web search
 */

"use client";

import { useState, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { ArrowUp, ArrowUpRight, BookOpen, X, MapPin, Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { schoolsService } from "@/lib/services/services/schools.service";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { useRouter } from "next/navigation";
import { messagesService } from "@/lib/services/services/messages.service";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { resolveSchoolCardImage, sanitizeImageSrc } from "@/lib/utils";
import FavoriteDetailModal from "./FavoriteDetailModal";

// ─────────────────────────────────────────────────────────────────────────
// SECTION 1: TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────

interface RecommendedSchool {
  id: string;
  name: string | null;
  coverImageUrl: string | null;
  city: string | null;
  monthlyPrice: number | null;
  averageRating: number | null;
}

interface WebSchool {
  source: "web";
  name: string;
  description?: string;
  city?: string;
  url?: string;
  price?: string;
  level?: string;
}

interface SchoolDetail extends RecommendedSchool {
  description?: string | null;
  schedule?: string | null;
  languages?: string | null;
  maxStudentsPerClass?: number | null;
  enrollmentOpen?: boolean | null;
  enrollmentYear?: number | null;
  address?: string | null;
  logoUrl?: string | null;
}

interface AISearchModeProps {
  onClose: () => void;
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION 2: MAIN COMPONENT - AI SEARCH MODAL
// ─────────────────────────────────────────────────────────────────────────

export function AISearchMode({ onClose }: AISearchModeProps) {
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const router = useRouter();
  const { showToast } = useToast();

  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [recommendedSchools, setRecommendedSchools] = useState<RecommendedSchool[]>([]);
  const [webSchools, setWebSchools] = useState<WebSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetail | null>(null);
  const [schoolFavorites, setSchoolFavorites] = useState<Set<string>>(new Set());
  const [contactingSending, setContactingSending] = useState(false);
  const [loadingSchoolDetail, setLoadingSchoolDetail] = useState(false);

  const recommendedCarouselRef = useRef<HTMLDivElement | null>(null);
  const webCarouselRef = useRef<HTMLDivElement | null>(null);

  const suggestions = [
    "Primaria bilingüe en CDMX",
    "Escuelas con enfoque Montessori",
    "Secundaria con deportes",
    "Universidad privada económica",
  ];

  async function sendPrompt(message: string) {
    const value = message.trim();
    if (!value || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: value }),
      });

      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        warning?: string;
        sources?: Array<{ title: string; uri: string }>;
        recommendedSchools?: RecommendedSchool[];
        webSchools?: WebSchool[];
      };

      if (!res.ok) {
        setReply(null);
        setSources([]);
        setRecommendedSchools([]);
        setWebSchools([]);
        setWarning(null);
        setError(data.error ?? "No se pudo obtener respuesta de la IA.");
        return;
      }

      setReply(data.reply ?? "No se recibió una respuesta.");
      setSources(data.sources ?? []);
      setRecommendedSchools(data.recommendedSchools ?? []);
      setWebSchools(data.webSchools ?? []);
      setWarning(data.warning ?? null);
    } catch {
      setReply(null);
      setSources([]);
      setRecommendedSchools([]);
      setWebSchools([]);
      setWarning(null);
      setError("Hubo un problema de red al contactar al asistente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit() {
    await sendPrompt(prompt);
  }

  async function handleSuggestionClick(suggestion: string) {
    setPrompt(suggestion);
    await sendPrompt(suggestion);
  }

  async function openSchoolModal(school: RecommendedSchool) {
    setLoadingSchoolDetail(true);
    setSelectedSchool(school as SchoolDetail);
    setModalOpen(true);

    try {
      const full = await schoolsService.getById(school.id);
      setSelectedSchool({
        ...school,
        description: full.description ?? undefined,
        schedule: full.schedule ?? undefined,
        languages: full.languages ?? undefined,
        maxStudentsPerClass: full.maxStudentsPerClass ?? undefined,
        enrollmentOpen: full.enrollmentOpen ?? undefined,
        enrollmentYear: full.enrollmentYear ?? undefined,
        address: full.address ?? undefined,
        logoUrl: full.logoUrl?.toString() ?? undefined,
        coverImageUrl: resolveSchoolCardImage(school.id, full.coverImageUrl?.toString(), full.logoUrl?.toString(), school.coverImageUrl),
        averageRating: full.averageRating ?? school.averageRating,
      });
    } catch (e) {
      console.warn("No se pudo cargar detalle de la escuela", e);
    } finally {
      setLoadingSchoolDetail(false);
    }
  }

  async function toggleFavorite(schoolId: string) {
    try {
      const result = await favoritesService.toggle(schoolId);
      if (result.isFavorite) {
        setSchoolFavorites((prev) => new Set([...prev, schoolId]));
        showToast({ title: "Agregado a favoritos", variant: "success" });
      } else {
        setSchoolFavorites((prev) => {
          const next = new Set(prev);
          next.delete(schoolId);
          return next;
        });
        showToast({ title: "Removido de favoritos", variant: "success" });
      }
    } catch (error) {
      showToast({ title: "Error al actualizar favoritos", variant: "error" });
    }
  }

  function normalizeExternalUrl(rawUrl?: string): string | undefined {
    if (!rawUrl) return undefined;
    const trimmed = rawUrl.trim();
    if (!trimmed) return undefined;
    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return new URL(trimmed).toString();
      if (trimmed.startsWith("/")) return new URL(trimmed, "https://www.google.com").toString();
      if (trimmed.startsWith("grounding-api-redirect/")) return new URL(`/${trimmed}`, "https://www.google.com").toString();
      return new URL(`https://${trimmed.replace(/^\/+/, "")}`).toString();
    } catch { return undefined; }
  }

  function scrollCarousel(ref: RefObject<HTMLDivElement | null>, direction: "left" | "right") {
    const container = ref.current;
    if (!container) return;
    const amount = Math.max(300, Math.floor(container.clientWidth * 0.7));
    container.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto bg-white rounded-3xl p-10 py-16 relative overflow-hidden"
    >
      <div className="flex flex-col items-center text-center gap-12">
        {/* ⚪ AI PULSE */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-indigo-600 blur-xl"
          />
          <div className="relative w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center shadow-lg">
             <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.4em]">Asistente de Búsqueda</p>
          <h2 className="text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            Encuentra la escuela ideal
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Describe lo que buscas y deja que nuestra IA analice las mejores opciones para ti.
          </p>
        </div>

        {/* 🔳 INPUT */}
        <div className="relative w-full max-w-xl">
          <div className="flex items-center bg-slate-50 rounded-[2rem] px-8 py-5 border border-slate-100 focus-within:border-indigo-600 focus-within:bg-white transition-all shadow-sm">
            <input
              placeholder="Ej: Primaria bilingüe en Querétaro con artes..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              className="flex-1 bg-transparent outline-none text-base text-slate-800 placeholder:text-slate-300 font-medium"
            />
            <button
              onClick={() => void handleSubmit()}
              disabled={isLoading}
              className="ml-4 w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-50 active:scale-90 shadow-lg shadow-indigo-100"
            >
              {isLoading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowUp size={20} />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-xl">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => void handleSuggestionClick(s)}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-full bg-white border border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:border-indigo-200 hover:text-indigo-600 transition-all hover:shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>

        {/* 🏫 RESULTS CAROUSELS */}
        {(recommendedSchools.length > 0 || webSchools.length > 0) && (
          <div className="w-full mt-24 space-y-28">
            <div className="text-center space-y-4 max-w-2xl mx-auto px-4">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.5em]">Resultados</p>
              <h3 className="text-4xl font-bold text-slate-900 tracking-tight">Aquí está tu resultado</h3>
              <p className="text-sm text-slate-400 leading-relaxed">Hemos consolidado las mejores opciones locales y web para tu búsqueda.</p>
            </div>

            {/* SECTION 1: SKOOLIA */}
            {recommendedSchools.length > 0 && (
              <div className="space-y-12">
                <div className="flex items-center justify-between px-6">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3">
                     <span className="w-8 h-px bg-indigo-600" /> Selección Skoolia
                  </h4>
                  {recommendedSchools.length > 1 && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => scrollCarousel(recommendedCarouselRef, "left")} className="h-12 w-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"><ChevronLeft size={20}/></button>
                      <button onClick={() => scrollCarousel(recommendedCarouselRef, "right")} className="h-12 w-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-indigo-600 transition-all active:scale-95 shadow-sm"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </div>
                <div ref={recommendedCarouselRef} className="flex gap-8 overflow-x-auto pb-12 px-6 snap-x snap-mandatory scrollbar-none no-scrollbar">
                  {recommendedSchools.map((s) => (
                    <div key={s.id} className="min-w-[320px] md:min-w-[680px] snap-start">
                      <div onClick={() => openSchoolModal(s)} className="group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-indigo-100/50 transition-all duration-500 cursor-pointer flex flex-col md:flex-row h-full">
                        <div className="relative w-full md:w-64 h-56 md:h-auto overflow-hidden shrink-0">
                          <Image src={resolveSchoolCardImage(s.id, s.coverImageUrl)} alt={s.name || ""} fill className="object-cover group-hover:scale-110 transition-transform duration-700" unoptimized />
                        </div>
                        <div className="flex-1 p-10 space-y-8 flex flex-col justify-center">
                          <div className="flex items-center justify-between">
                            <span className="px-3 py-1 bg-indigo-50 rounded-full text-[9px] font-bold text-indigo-600 uppercase tracking-widest">Recomendación Top</span>
                            <Heart size={18} className={schoolFavorites.has(s.id) ? 'fill-indigo-600 text-indigo-600' : 'text-slate-200'} />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight">{s.name}</h4>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <MapPin size={12} className="text-indigo-400" /> <span>{s.city || "Ubicación"}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                             <span className="text-lg font-bold text-slate-900">${s.monthlyPrice?.toLocaleString() || "—"} <span className="text-[10px] text-slate-400 uppercase">mxn</span></span>
                             <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest group-hover:translate-x-2 transition-transform">Explorar <ArrowUpRight size={18} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: WEB */}
            {webSchools.length > 0 && (
              <div className="space-y-12">
                <div className="flex items-center justify-between px-6">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-[0.4em] flex items-center gap-3">
                     <span className="w-8 h-px bg-violet-600" /> Exploración Web
                  </h4>
                  {webSchools.length > 1 && (
                    <div className="flex items-center gap-3">
                      <button onClick={() => scrollCarousel(webCarouselRef, "left")} className="h-12 w-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-violet-600 transition-all active:scale-95 shadow-sm"><ChevronLeft size={20}/></button>
                      <button onClick={() => scrollCarousel(webCarouselRef, "right")} className="h-12 w-12 rounded-2xl border border-slate-100 bg-white flex items-center justify-center text-slate-300 hover:text-violet-600 transition-all active:scale-95 shadow-sm"><ChevronRight size={20}/></button>
                    </div>
                  )}
                </div>
                <div ref={webCarouselRef} className="flex gap-8 overflow-x-auto pb-12 px-6 snap-x snap-mandatory scrollbar-none no-scrollbar">
                  {webSchools.map((s, i) => (
                    <div key={i} className="min-w-[320px] md:min-w-[680px] snap-start">
                      {normalizeExternalUrl(s.url) ? (
                        <a href={normalizeExternalUrl(s.url)} target="_blank" rel="noopener noreferrer" className="group relative bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-violet-100/30 transition-all duration-500 flex flex-col md:flex-row h-full">
                          <div className="relative w-full md:w-64 h-56 md:h-auto bg-slate-50 flex items-center justify-center shrink-0">
                             <div className="text-5xl group-hover:scale-125 transition-transform duration-700">🌐</div>
                          </div>
                          <div className="flex-1 p-10 space-y-8 flex flex-col justify-center">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 bg-violet-50 rounded-full text-[9px] font-bold text-violet-600 uppercase tracking-widest">{s.level || "Web Discovery"}</span>
                              <ArrowUpRight size={18} className="text-slate-300 group-hover:text-violet-600 transition-all" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="text-2xl font-bold text-slate-900 group-hover:text-violet-600 transition-colors line-clamp-1 leading-tight">{s.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-1">{s.city || "Fuente Externa"}</p>
                            </div>
                            <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed italic">"{s.description || "Explora más detalles en el sitio oficial de esta institución."}"</p>
                          </div>
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button onClick={onClose} className="mt-16 text-[11px] font-bold text-slate-300 hover:text-indigo-600 uppercase tracking-[0.4em] transition-colors">Cerrar buscador</button>
      </div>

      {modalOpen && selectedSchool && (
        <FavoriteDetailModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onRatingUpdated={() => {}} 
          item={{
            id: selectedSchool.id,
            imageUrl: selectedSchool.coverImageUrl || undefined,
            title: selectedSchool.name || "Sin nombre",
            location: selectedSchool.city || selectedSchool.address || "Sin ubicación",
            price: selectedSchool.monthlyPrice || 0,
            description: selectedSchool.description || undefined,
            rating: selectedSchool.averageRating || 5,
            schedule: selectedSchool.schedule || undefined,
            languages: selectedSchool.languages || undefined,
            studentsPerClass: selectedSchool.maxStudentsPerClass || undefined,
            enrollmentOpen: selectedSchool.enrollmentOpen || false,
            enrollmentYear: selectedSchool.enrollmentYear || undefined,
            monthlyPrice: selectedSchool.monthlyPrice || undefined,
          }}
        />
      )}
    </motion.div>
  );
}
