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
 * 
 * Key Features:
 *   ✓ Animated orb (breathing gradient, rotating conic, scaling core)
 *   ✓ AI search input with suggestion buttons
 *   ✓ CAROUSEL #1: Recommended schools from database
 *   ✓ CAROUSEL #2: Schools found on internet (web results)
 *   ✓ Navigation arrows (left/right) for both carousels
 *   ✓ School detail modal with full info (size, languages, schedule, etc.)
 *   ✓ Favorite schools toggle
 *   ✓ Contact school messaging feature
 *   ✓ URL normalization for web school links
 *   ✓ Error + warning messages display
 *   ✓ Web sources list at bottom
 * 
 * Data Flow:
 *   1. User enters search query
 *   2. Frontend calls /api/chat (backend)
 *   3. Backend queries Gemini + database
 *   4. Returns: reply, recommendedSchools[], webSchools[], sources[]
 *   5. Frontend renders carousels with recommendations
 * 
 * Modified: Session 9
 *   - Converted grid layouts to horizontal carousels (overflow-x-auto)
 *   - Added carousel navigation refs + scroll functions
 *   - Added conditional nav visibility (hidden when ≤2 items)
 *   - Added URL normalization for web school links
 *   - Added fallback UI for invalid web school URLs
 * =============================================================================
 */

"use client";

import { useState, useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { ArrowUp, X, MapPin, Star, Heart, ChevronLeft, ChevronRight } from "lucide-react";
import CatalogCard from "../layout/CatalogCard";
import { schoolsService } from "@/lib/services/services/schools.service";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { useRouter } from "next/navigation";
import { messagesService } from "@/lib/services/services/messages.service";
import { useToast } from "@/components/ui/toast";
import Image from "next/image";
import { resolveSchoolCardImage, sanitizeImageSrc } from "@/lib/utils";

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
  const router = useRouter();
  const { showToast } = useToast();
  
  // ─────────────────────────────────────────────────────────────────────────
  // STATE: Search input & AI response
  // ─────────────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; uri: string }>>([]);
  const [recommendedSchools, setRecommendedSchools] = useState<RecommendedSchool[]>([]);
  const [webSchools, setWebSchools] = useState<WebSchool[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // ─────────────────────────────────────────────────────────────────────────
  // STATE: School detail modal & interaction
  // ─────────────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetail | null>(null);
  const [schoolFavorites, setSchoolFavorites] = useState<Set<string>>(new Set());
  const [contactingSending, setContactingSending] = useState(false);
  const [loadingSchoolDetail, setLoadingSchoolDetail] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // REFS: Carousel scroll containers (for arrow navigation)
  // ─────────────────────────────────────────────────────────────────────────
  const recommendedCarouselRef = useRef<HTMLDivElement | null>(null);
  const webCarouselRef = useRef<HTMLDivElement | null>(null);

  // ─────────────────────────────────────────────────────────────────────────
  // CONST: AI search suggestions
  // ─────────────────────────────────────────────────────────────────────────
  const suggestions = [
    "Primaria bilingüe en CDMX",
    "Escuelas con enfoque Montessori",
    "Secundaria con deportes",
    "Universidad privada económica",
  ];

  // ─────────────────────────────────────────────────────────────────────────
  // HANDLER: Send AI search query to /api/chat backend
  // ─────────────────────────────────────────────────────────────────────────

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
    setCurrentImageIndex(0);
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
        showToast({
          title: "Agregado a favoritos",
          variant: "success",
        });
      } else {
        setSchoolFavorites((prev) => {
          const next = new Set(prev);
          next.delete(schoolId);
          return next;
        });
        showToast({
          title: "Removido de favoritos",
          variant: "success",
        });
      }
    } catch (error) {
      showToast({
        title: "Error al actualizar favoritos",
        variant: "error",
      });
      console.error(error);
    }
  }

  async function handleContact() {
    if (!selectedSchool?.id || contactingSending) return;

    try {
      setContactingSending(true);
      await messagesService.sendParentMessage(
        selectedSchool.id,
        "Hola, me interesa conocer más información de su escuela."
      );
      setModalOpen(false);
      showToast({
        title: "Mensaje enviado",
        variant: "success",
      });
      router.push(`/parents/messages/${selectedSchool.id}`);
    } catch (error) {
      showToast({
        title: "Error al enviar mensaje",
        variant: "error",
      });
      console.error(error);
    } finally {
      setContactingSending(false);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY: URL Normalization for web school links
  // ─────────────────────────────────────────────────────────────────────────
  // Purpose: Fix malformed URLs from Gemini grounding API
  //   - Handles: http/https URLs, relative paths, grounding-api-redirect

  function normalizeExternalUrl(rawUrl?: string): string | undefined {
    if (!rawUrl) return undefined;
    const trimmed = rawUrl.trim();
    if (!trimmed) return undefined;

    try {
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return new URL(trimmed).toString();
      }

      if (trimmed.startsWith("/")) {
        return new URL(trimmed, "https://www.google.com").toString();
      }

      if (trimmed.startsWith("grounding-api-redirect/")) {
        return new URL(`/${trimmed}`, "https://www.google.com").toString();
      }

      return new URL(`https://${trimmed.replace(/^\/+/, "")}`).toString();
    } catch {
      return undefined;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY: Carousel smooth scroll navigation
  // ─────────────────────────────────────────────────────────────────────────

  function scrollCarousel(
    ref: RefObject<HTMLDivElement | null>,
    direction: "left" | "right"
  ) {
    const container = ref.current;
    if (!container) return;

    const amount = Math.max(280, Math.floor(container.clientWidth * 0.8));
    container.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }

  const modalImages = selectedSchool
    ? Array.from(
        new Set(
          [
            sanitizeImageSrc(selectedSchool.coverImageUrl),
            sanitizeImageSrc(selectedSchool.logoUrl),
            // Fallback gallery images to always allow carousel navigation
            `https://picsum.photos/seed/${selectedSchool.id}-gallery-1/1200/800`,
            `https://picsum.photos/seed/${selectedSchool.id}-gallery-2/1200/800`,
            `https://picsum.photos/seed/${selectedSchool.id}-gallery-3/1200/800`,
          ].filter((url): url is string => Boolean(url)),
        ),
      )
    : [];

  function goToPrevModalImage() {
    if (modalImages.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? modalImages.length - 1 : prev - 1
    );
  }

  function goToNextModalImage() {
    if (modalImages.length <= 1) return;
    setCurrentImageIndex((prev) =>
      prev === modalImages.length - 1 ? 0 : prev + 1
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-6xl mx-auto bg-white rounded-3xl  p-10 py-20 relative overflow-hidden"
    >
      <div className="flex flex-col items-center text-center gap-8">
        {/* 🌈 AI Orb — Moonshot Style */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          {/* Fondo respirando */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1.05, 1],
              opacity: [0.8, 1, 0.9, 0.8],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-full 
    bg-[radial-gradient(circle_at_30%_30%,#ffd6e0,#fbc2eb,#a6c1ee,#fddb92)] 
    blur-2xl"
          />

          {/* Capa líquida interna */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-32 h-32 rounded-full 
    bg-[conic-gradient(from_0deg,#fbc2eb,#a6c1ee,#fddb92,#fbc2eb)] 
    blur-xl opacity-80"
          />

          {/* Núcleo suave */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative w-24 h-24 rounded-full 
    bg-[radial-gradient(circle_at_40%_40%,#ffffff,#e0c3fc,#8ec5fc)] 
    blur-md"
          />
        </div>

        <p className="text-neutral-600 max-w-md text-base leading-relaxed">
          Describe lo que estás buscando y nuestra IA te ayudará a encontrar la
          mejor opción educativa para tu familia.
        </p>

        {/* AI Suggestions */}
        <div className="flex flex-wrap justify-center gap-3 mb-6 max-w-2xl">
          {suggestions.map((suggestion, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                void handleSuggestionClick(suggestion);
              }}
              disabled={isLoading}
              className="px-4 py-2 rounded-full bg-white/60 backdrop-blur-md border border-neutral-200 text-sm text-neutral-700 hover:bg-neutral-100 transition shadow-sm disabled:opacity-50"
            >
              {suggestion}
            </motion.button>
          ))}
        </div>

        {/* AI Input */}
        <div className="relative w-full max-w-2xl">
          <div className="flex items-center bg-white rounded-full px-6 py-4 shadow-lg border border-neutral-200">
            <input
              placeholder="Describe lo que estás buscando..."
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              className="flex-1 bg-transparent outline-none text-base text-neutral-800 placeholder:text-neutral-400"
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                void handleSubmit();
              }}
              disabled={isLoading}
              className="ml-4 w-11 h-11 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#1973FC] transition disabled:opacity-50"
            >
              {isLoading ? (
                <span className="text-xs font-semibold">...</span>
              ) : (
                <ArrowUp size={18} />
              )}
            </motion.button>
          </div>
        </div>

        {error ? (
          <div className="w-full max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {warning ? (
          <div className="w-full max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-left text-sm text-amber-800">
            {warning}
          </div>
        ) : null}

        {/* Contexto de la IA */}
        {reply ? (
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-white/80 px-5 py-4 text-left text-sm text-neutral-700 whitespace-pre-wrap">
            {reply}
          </div>
        ) : null}

        {/* Escuelas Recomendadas - Carrusel */}
        {recommendedSchools.length > 0 ? (
          <div className="w-full mt-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 text-left">
                Escuelas Recomendadas
              </h3>
              {recommendedSchools.length > 2 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(recommendedCarouselRef, "left")}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label="Desplazar carrusel recomendado a la izquierda"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(recommendedCarouselRef, "right")}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label="Desplazar carrusel recomendado a la derecha"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            <div
              ref={recommendedCarouselRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300"
            >
              {recommendedSchools.map((school) => (
                <div key={school.id} className="min-w-[280px] sm:min-w-[340px] snap-start">
                  <CatalogCard
                    imageSrc={resolveSchoolCardImage(school.id, school.coverImageUrl)}
                    imageAlt={school.name ?? "Escuela"}
                    typeLabel="ESCUELA"
                    title={school.name ?? "Sin nombre"}
                    location={school.city ?? "Sin ubicación"}
                    priceLabel="MENSUALIDAD"
                    price={school.monthlyPrice ?? 0}
                    priceFormatted={
                      typeof school.monthlyPrice === "number"
                        ? `$${school.monthlyPrice.toLocaleString("es-MX")}`
                        : "N/A"
                    }
                    isFavorite={schoolFavorites.has(school.id)}
                    onFavoriteToggle={(e) => {
                      e?.stopPropagation();
                      void toggleFavorite(school.id);
                    }}
                    onCardClick={() => {
                      void openSchoolModal(school);
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Escuelas de Internet - Carrusel */}
        {webSchools.length > 0 ? (
          <div className="w-full mt-8">
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 text-left">
                Otras Opciones en Internet
              </h3>
              {webSchools.length > 2 ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollCarousel(webCarouselRef, "left")}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label="Desplazar carrusel web a la izquierda"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel(webCarouselRef, "right")}
                    className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    aria-label="Desplazar carrusel web a la derecha"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
            <div
              ref={webCarouselRef}
              className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300"
            >
              {webSchools.map((school, idx) => (
                <div key={idx} className="min-w-[280px] sm:min-w-[340px] snap-start">
                  {normalizeExternalUrl(school.url) ? (
                    <a
                      href={normalizeExternalUrl(school.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative h-72 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100"
                    >
                      {/* Contenido */}
                      <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                        <div className="text-5xl mb-4">🌐</div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2">
                            {school.name}
                          </h4>
                          {school.city ? (
                            <div className="flex items-center gap-2 text-sm text-slate-700 mb-3">
                              <MapPin className="h-4 w-4" />
                              <span>{school.city}</span>
                            </div>
                          ) : null}
                          {school.description ? (
                            <p className="text-sm text-slate-700 line-clamp-2 mb-3">
                              {school.description}
                            </p>
                          ) : null}
                          <div className="flex items-center justify-between gap-2">
                            {school.level ? (
                              <span className="inline-block px-3 py-1 bg-white/80 rounded-full text-xs font-semibold text-slate-700">
                                {school.level}
                              </span>
                            ) : null}
                            {school.price ? (
                              <span className="text-sm font-bold text-indigo-700">
                                {school.price}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-5" />
                      <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white rounded-full p-2 shadow-lg">
                          <ArrowUp className="h-4 w-4 text-indigo-600 rotate-45" />
                        </div>
                      </div>
                    </a>
                  ) : (
                    <div className="relative h-72 rounded-2xl overflow-hidden shadow-lg flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 opacity-90">
                      <div className="absolute inset-0 p-6 flex flex-col justify-between">
                        <div className="text-5xl mb-4">🌐</div>
                        <div>
                          <h4 className="text-xl font-bold text-slate-900 line-clamp-2 mb-2">
                            {school.name}
                          </h4>
                          <p className="text-sm text-slate-600">No se encontró un enlace válido para esta escuela.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Fuentes web */}
        {sources.length > 0 ? (
          <div className="w-full max-w-2xl rounded-2xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Fuentes web
            </p>
            <ul className="mt-3 space-y-2">
              {sources.map((source) => (
                <li key={source.uri}>
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    {source.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <button
          onClick={onClose}
          className="text-sm text-neutral-500 hover:text-neutral-800 transition"
        >
          Volver a búsqueda normal
        </button>
      </div>

      {/* Modal Detalle de Escuela */}
      {modalOpen && selectedSchool && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />

          {/* Modal */}
          <div className="relative z-[201] mx-4 w-full max-w-6xl overflow-hidden rounded-2xl sm:rounded-4xl bg-white surface max-h-[90vh]">
            <button
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow z-10"
              aria-label="Cerrar"
              onClick={() => setModalOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_520px]">
              {/* Left media */}
              <div className="relative h-65 sm:h-80 md:h-[72vh] w-full bg-slate-100">
                {modalImages.length > 0 ? (
                  <Image
                    src={modalImages[currentImageIndex]}
                    alt={selectedSchool.name ?? "Escuela"}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                    priority={false}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-slate-400">
                    Imagen
                  </div>
                )}

                {modalImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={goToPrevModalImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-slate-700 shadow hover:bg-white"
                      aria-label="Imagen anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNextModalImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-slate-700 shadow hover:bg-white"
                      aria-label="Imagen siguiente"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/45 px-3 py-1.5">
                      {modalImages.map((_, index) => (
                        <button
                          key={`modal-dot-${index}`}
                          type="button"
                          onClick={() => setCurrentImageIndex(index)}
                          aria-label={`Ir a imagen ${index + 1}`}
                          className={`h-2.5 w-2.5 rounded-full transition ${
                            currentImageIndex === index
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/80"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              {/* Right content */}
              <div className="p-5 sm:p-8 overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold tracking-widest text-indigo-700">
                    ESCUELA
                  </span>
                </div>
                <h2 className="mt-3 text-2xl sm:text-[28px] font-extrabold leading-tight text-slate-900">
                  {selectedSchool.name}
                </h2>
                <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-slate-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedSchool.city || selectedSchool.address || "Sin ubicación"}</span>
                  <Star className="h-4 w-4 text-amber-400" />
                  <span>
                    {typeof selectedSchool.averageRating === "number"
                      ? selectedSchool.averageRating.toFixed(1)
                      : "—"}
                    {typeof selectedSchool.averageRating === "number"
                      ? " (valoración)"
                      : ""}
                  </span>
                </div>

                {/* Short description */}
                {selectedSchool.description ? (
                  <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-700">
                    {selectedSchool.description}
                  </p>
                ) : null}

                <div className="mt-6 space-y-2 text-xs sm:text-sm text-slate-600">
                  {selectedSchool.schedule ? (
                    <p>
                      <span className="font-semibold">Horario:</span> {selectedSchool.schedule}
                    </p>
                  ) : null}
                  {selectedSchool.languages ? (
                    <p>
                      <span className="font-semibold">Idiomas:</span> {selectedSchool.languages}
                    </p>
                  ) : null}
                  {selectedSchool.maxStudentsPerClass ? (
                    <p>
                      <span className="font-semibold">Alumnos por salón:</span>{" "}
                      {selectedSchool.maxStudentsPerClass}
                    </p>
                  ) : null}
                </div>

                {/* Footer action */}
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-500">
                      MENSUALIDAD ESTIMADA
                    </p>
                    <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">
                      {typeof selectedSchool.monthlyPrice === "number"
                        ? `$${selectedSchool.monthlyPrice.toLocaleString("es-MX")}`
                        : "N/A"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      className="flex-1 sm:flex-initial w-full sm:w-auto rounded-full bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      onClick={() => void handleContact()}
                      disabled={contactingSending || loadingSchoolDetail}
                    >
                      {contactingSending ? "Enviando..." : "Contactar"}
                    </button>
                    <button
                      className="flex-1 sm:flex-initial w-full sm:w-auto rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      onClick={() => void toggleFavorite(selectedSchool.id)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          schoolFavorites.has(selectedSchool.id)
                            ? "fill-current text-red-500"
                            : ""
                        }`}
                      />
                      {schoolFavorites.has(selectedSchool.id) ? "Favorito" : "Agregar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
