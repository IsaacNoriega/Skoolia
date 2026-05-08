"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import CatalogCard from "../layout/CatalogCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import FavoritesEmptyState from "./FavoritesEmptyState";
import FavoriteDetailModal from "./FavoriteDetailModal";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import { coursesService } from "@/lib/services/services/courses.service";
import { resolveSchoolCardImage } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ExternalLink,
  MapPin,
  DollarSign,
  Star,
  Clock,
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  CalendarCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ArrowLeft
} from "lucide-react";

type FavoriteItem = {
  id: string;
  imageUrl: string | null;
  title: string;
  location: string;
  price: number | string;
  description?: string;
  rating?: number;
  schedule?: string;
  languages?: string;
  studentsPerClass?: number | string;
  enrollmentOpen?: boolean;
  enrollmentYear?: number;
  monthlyPrice?: number;
  planName?: string;
  gallery?: string[];
  coverImageUrl?: string | null;
  logoUrl?: string | null;
};

export default function FavoritesGrid() {
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const [open, setOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [selected, setSelected] = useState<FavoriteItem | undefined>();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareDetails, setCompareDetails] = useState<Record<string, FavoriteItem>>({});
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<'schools' | 'courses' | null>(null);

  const handleRatingUpdated = (schoolId: string, averageRating?: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === schoolId
          ? {
            ...item,
            rating: averageRating,
          }
          : item,
      ),
    );

    setSelected((prev) =>
      prev && prev.id === schoolId
        ? {
          ...prev,
          rating: averageRating,
        }
        : prev,
    );
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await favoritesService.listForMe();
        if (!mounted) return;
        const mapped: FavoriteItem[] = data.map((fav) => {
          if (fav.type === "SCHOOL") {
            return {
              id: fav.id,
              imageUrl: resolveSchoolCardImage(fav.id, fav.coverImageUrl, fav.logoUrl),
              title: fav.name,
              location: fav.city ?? "",
              price: fav.monthlyPrice ?? "N/A",
              description: fav.description,
              rating: fav.averageRating,
              schedule: fav.schedule,
              languages: fav.languages,
              studentsPerClass: fav.maxStudentsPerClass,
              enrollmentOpen: fav.enrollmentOpen,
              enrollmentYear: fav.enrollmentYear,
              monthlyPrice: fav.monthlyPrice,
              coverImageUrl: fav.coverImageUrl,
              logoUrl: fav.logoUrl,
            };
          } else {
            // COURSE
            return {
              id: fav.id,
              imageUrl: fav.coverImageUrl,
              title: fav.name,
              location: fav.city ?? "",
              price: fav.price ?? "N/A",
              description: fav.description,
              schedule: fav.startDate ? `Inicio: ${fav.startDate}` : undefined,
              languages: fav.languages,
              studentsPerClass: fav.capacity,
              enrollmentOpen: undefined,
              enrollmentYear: undefined,
              monthlyPrice: undefined,
            };
          }
        });
        setItems(mapped);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const schoolItems = useMemo(() => items.filter(it => it.monthlyPrice !== undefined), [items]);
  const courseItems = useMemo(() => items.filter(it => it.monthlyPrice === undefined), [items]);

  const openModal = (item: FavoriteItem) => {
    setSelected(item);
    setOpen(true);

    // Enriquecer datos del modal con detalles completos
    (async () => {
      try {
        const isSchool = item.monthlyPrice !== undefined;
        const full = isSchool
          ? await schoolsService.getById(item.id)
          : await coursesService.getById(item.id);

        setSelected((prev) => (
          prev && prev.id === item.id
            ? {
              ...prev,
              description: full.description ?? prev.description,
              rating: (full as any).averageRating ?? prev.rating,
              schedule: (full as any).schedule ?? prev.schedule,
              languages: (full as any).languages ?? prev.languages,
              studentsPerClass: (full as any).maxStudentsPerClass ?? (full as any).capacity ?? prev.studentsPerClass,
              enrollmentOpen: (full as any).enrollmentOpen ?? prev.enrollmentOpen,
              enrollmentYear: (full as any).enrollmentYear ?? prev.enrollmentYear,
              monthlyPrice: isSchool ? (full as any).monthlyPrice : undefined,
              price: isSchool ? (full as any).monthlyPrice : (full as any).price,
              imageUrl: isSchool
                ? resolveSchoolCardImage(item.id, (full as any).coverImageUrl, (full as any).logoUrl, prev.imageUrl)
                : (full as any).coverImageUrl || prev.imageUrl,
              location: (full as any).city || (full as any).address || prev.location,
              gallery: (full as any).gallery,
              coverImageUrl: (full as any).coverImageUrl,
              logoUrl: (full as any).logoUrl,
            }
            : prev
        ));
      } catch (e) {
        console.warn('No se pudo cargar detalle del elemento favorito', e);
      }
    })();
  };

  const compareItems = useMemo(
    () =>
      compareIds
        .map((id) => compareDetails[id] ?? items.find((item) => item.id === id))
        .filter((item): item is FavoriteItem => Boolean(item)),
    [compareDetails, compareIds, items],
  );

  const toggleCompare = (itemId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId);
      }

      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, itemId];
    });
  };

  const clearCompare = () => {
    setCompareIds([]);
    setCompareOpen(false);
  };

  const openCompareModal = async () => {
    if (compareIds.length < 2) return;

    setCompareOpen(true);
    setLoadingCompare(true);

    try {
      const pendingIds = compareIds.filter((id) => !compareDetails[id]);
      if (!pendingIds.length) return;

      const detailResults = await Promise.all(
        pendingIds.map(async (id) => {
          try {
            const originalItem = items.find(it => it.id === id);
            const isSchool = originalItem?.monthlyPrice !== undefined;

            const full = isSchool
              ? await schoolsService.getById(id)
              : await coursesService.getById(id);

            return {
              id,
              data: {
                id,
                imageUrl: isSchool
                  ? resolveSchoolCardImage(id, (full as any).coverImageUrl, (full as any).logoUrl)
                  : (full as any).coverImageUrl,
                title: full.name,
                location: (full as any).city || (full as any).address || "",
                price: isSchool ? (full as any).monthlyPrice : (full as any).price ?? "N/A",
                description: full.description ?? undefined,
                rating: (full as any).averageRating ?? undefined,
                schedule: (full as any).schedule ?? (full as any).startDate ? `Inicio: ${(full as any).startDate}` : undefined,
                languages: (full as any).languages ?? undefined,
                studentsPerClass: (full as any).maxStudentsPerClass ?? (full as any).capacity ?? undefined,
                enrollmentOpen: (full as any).enrollmentOpen,
                enrollmentYear: (full as any).enrollmentYear ?? undefined,
                monthlyPrice: isSchool ? (full as any).monthlyPrice : undefined,
              } as FavoriteItem,
            };
          } catch {
            return null;
          }
        }),
      );

      setCompareDetails((prev) => {
        const next = { ...prev };
        detailResults.forEach((result) => {
          if (!result) return;
          next[result.id] = result.data;
        });
        return next;
      });
    } finally {
      setLoadingCompare(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (activeCategory === 'schools') return schoolItems;
    if (activeCategory === 'courses') return courseItems;
    return [];
  }, [activeCategory, schoolItems, courseItems]);

  const categoryTitle = activeCategory === 'schools' ? 'Instituciones Escolares' : 'Cursos Especializados';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando favoritos...</p>
      </div>
    );
  }

  if (!items.length) {
    return <FavoritesEmptyState />;
  }

  // VISTA DE CATEGORÍA DETALLADA
  if (activeCategory) {
    return (
      <div className="space-y-8 pb-20">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h3 className="text-2xl font-black text-slate-900">{categoryTitle}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                {filteredItems.length} Elementos guardados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-4 py-2 border-r border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Comparador</p>
              <p className="text-sm font-black text-indigo-600">{compareIds.length} / 3</p>
            </div>
            <button
              onClick={clearCompare}
              disabled={!compareIds.length}
              className="h-10 px-4 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
            >
              Limpiar
            </button>
            <button
              onClick={() => void openCompareModal()}
              disabled={compareIds.length < 2}
              className="h-10 px-6 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              Comparar ahora
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredItems.map((item) => {
            const isComparing = compareIds.includes(item.id);
            return (
              <CatalogCard
                key={item.id}
                imageSrc={item.imageUrl ?? undefined}
                imageAlt={item.title}
                typeLabel={item.monthlyPrice ? "ESCUELA" : "CURSO"}
                title={item.title}
                location={item.location}
                priceLabel={item.monthlyPrice ? "MENSUALIDAD" : "PRECIO"}
                price={typeof item.price === 'number' ? item.price : 0}
                priceFormatted={typeof item.price === 'number' ? `$${item.price.toLocaleString()}` : String(item.price)}
                description={item.description}
                languages={item.languages}
                studentsPerClass={item.studentsPerClass}
                isComparing={isComparing}
                onCompareToggle={() => toggleCompare(item.id)}
                onCardClick={async () => {
                  openModal(item);
                  if (user?.id) {
                    await trackLead({
                      targetId: item.id,
                      originType: item.monthlyPrice ? "SCHOOL" : "COURSE",
                      trigger: "VIEW_MORE",
                      status: "INTERESADO",
                    });
                  }
                }}
                onAction={() => openModal(item)}
                isFavorite={true}
                onFavoriteToggle={async () => {
                  await favoritesService.toggle(item.id);
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                  setCompareIds((prev) => prev.filter((id) => id !== item.id));
                }}
              />
            );
          })}
        </div>

        <FavoriteDetailModal
          open={open}
          onClose={() => setOpen(false)}
          onRatingUpdated={handleRatingUpdated}
          item={
            selected && {
              id: selected.id,
              imageUrl: selected.imageUrl ?? undefined,
              badges: [],
              level: selected.monthlyPrice ? "ESCUELA" : "CURSO",
              title: selected.title,
              location: selected.location,
              price: typeof selected.price === "number" ? `$${selected.price.toLocaleString()}` : selected.price,
              description: selected.description,
              rating: selected.rating,
              schedule: selected.schedule,
              languages: selected.languages,
              studentsPerClass: selected.studentsPerClass,
              enrollmentOpen: selected.enrollmentOpen,
              enrollmentYear: selected.enrollmentYear,
              monthlyPrice: selected.monthlyPrice,
              gallery: selected.gallery,
              coverImageUrl: selected.coverImageUrl ?? undefined,
              logoUrl: selected.logoUrl ?? undefined,
            }
          }
        />

        <SchoolCompareModal
          open={compareOpen}
          items={compareItems}
          loading={loadingCompare}
          onClose={() => setCompareOpen(false)}
        />
      </div>
    );
  }

  // DASHBOARD VIEW CON CAROUSELS
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/50 rounded-full blur-[120px] -mr-64 -mt-64" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[120px] -ml-64 -mb-64" />
      </div>

      <div className="relative z-10 space-y-20 pb-20 max-w-full">
        {/* SECCIÓN ESCUELAS */}
        <CarouselSection
          title="Escuelas Guardadas"
          subtitle="EXPLORA TUS INSTITUCIONES FAVORITAS"
          items={schoolItems}
          onVerMas={() => setActiveCategory('schools')}
          onOpenModal={openModal}
          onFavoriteToggle={async (id) => {
            await favoritesService.toggle(id);
            setItems((prev) => prev.filter((x) => x.id !== id));
            setCompareIds((prev) => prev.filter((x) => x !== id));
          }}
        />

        {/* SECCIÓN CURSOS */}
        <CarouselSection
          title="Cursos Especializados"
          subtitle="TUS PROGRAMAS DE FORMACIÓN GUARDADOS"
          items={courseItems}
          onVerMas={() => setActiveCategory('courses')}
          onOpenModal={openModal}
          onFavoriteToggle={async (id) => {
            await favoritesService.toggle(id);
            setItems((prev) => prev.filter((x) => x.id !== id));
            setCompareIds((prev) => prev.filter((x) => x !== id));
          }}
        />

        <FavoriteDetailModal
          open={open}
          onClose={() => setOpen(false)}
          onRatingUpdated={handleRatingUpdated}
          item={
            selected && {
              id: selected.id,
              imageUrl: selected.imageUrl ?? undefined,
              badges: [],
              level: selected.monthlyPrice ? "ESCUELA" : "CURSO",
              title: selected.title,
              location: selected.location,
              price: typeof selected.price === "number" ? `$${selected.price.toLocaleString()}` : selected.price,
              description: selected.description,
              rating: selected.rating,
              schedule: selected.schedule,
              languages: selected.languages,
              studentsPerClass: selected.studentsPerClass,
              enrollmentOpen: selected.enrollmentOpen,
              enrollmentYear: selected.enrollmentYear,
              monthlyPrice: selected.monthlyPrice,
              gallery: selected.gallery,
              coverImageUrl: selected.coverImageUrl ?? undefined,
              logoUrl: selected.logoUrl ?? undefined,
            }
          }
        />
      </div>
    </div>
  );
}

function CarouselSection({
  title,
  subtitle,
  items,
  onVerMas,
  onOpenModal,
  onFavoriteToggle
}: {
  title: string;
  subtitle: string;
  items: FavoriteItem[];
  onVerMas: () => void;
  onOpenModal: (item: FavoriteItem) => void;
  onFavoriteToggle: (id: string) => Promise<void>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  if (items.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      // Desplazar exactamente el ancho visible para mostrar el siguiente grupo de 3
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth
        : scrollLeft + clientWidth;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, [items]);

  return (
    <div className="space-y-8 max-w-full">
      <header className="flex items-end justify-between px-2">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] ml-0.5">{subtitle}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{title}</h3>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-md active:scale-90"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-md active:scale-90"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <button
            onClick={onVerMas}
            className="group hidden md:flex items-center gap-3 rounded-2xl bg-slate-900 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.1em] text-white hover:bg-indigo-600 transition-all duration-300 active:scale-95 shadow-lg shadow-slate-200"
          >
            Ver Todo
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </header>

      <div className="relative group overflow-hidden">
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-6 overflow-x-auto pb-10 scrollbar-hide snap-x snap-mandatory px-2 -mx-2"
        >
          {items.map((item) => (
            <motion.div 
              key={item.id} 
              className="flex-shrink-0 w-full sm:w-[calc((100%-48px)/3)] snap-start"
              whileHover={{ y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <CatalogCard
                imageSrc={item.imageUrl ?? undefined}
                imageAlt={item.title}
                typeLabel={item.monthlyPrice ? "ESCUELA" : "CURSO"}
                title={item.title}
                location={item.location}
                priceLabel={item.monthlyPrice ? "MENSUALIDAD" : "PRECIO"}
                price={typeof item.price === 'number' ? item.price : 0}
                priceFormatted={typeof item.price === 'number' ? `$${item.price.toLocaleString()}` : String(item.price)}
                description={item.description}
                languages={item.languages}
                studentsPerClass={item.studentsPerClass}
                onCardClick={() => onOpenModal(item)}
                onAction={() => onOpenModal(item)}
                isFavorite={true}
                onFavoriteToggle={() => onFavoriteToggle(item.id)}
                planName={item.planName}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatField(value?: string | number | boolean | null) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  return String(value);
}

function formatMonthlyPrice(item: FavoriteItem) {
  if (typeof item.monthlyPrice === "number") {
    return `$${item.monthlyPrice.toLocaleString()} MXN`;
  }
  if (typeof item.price === "number") {
    return `$${item.price.toLocaleString()} MXN`;
  }
  return formatField(item.price);
}

function SchoolCompareModal({
  open,
  items,
  loading,
  onClose,
}: {
  open: boolean;
  items: FavoriteItem[];
  loading: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-121 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-5 backdrop-blur-sm sm:px-8">
              <div>
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Comparador Premium</h3>
                </div>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Analiza y decide la mejor opción educativa para tu familia.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="group flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-all hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="h-5 w-5 transition-transform group-hover:rotate-90" />
              </button>
            </header>

            <div className="flex-1 overflow-auto p-6 sm:p-8">
              {loading ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
                  <p className="text-lg font-bold text-slate-600">Sincronizando detalles…</p>
                </div>
              ) : items.length < 2 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 rounded-3xl bg-indigo-50 p-6 text-indigo-600">
                    <Users className="h-12 w-12" />
                  </div>
                  <h4 className="text-xl font-bold text-slate-900">Selección insuficiente</h4>
                  <p className="max-w-md text-slate-500">
                    Agrega al menos 2 escuelas de tus favoritos para habilitar la comparación detallada.
                  </p>
                </div>
              ) : (
                <div className="min-w-full">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        <th className="sticky left-0 top-0 z-30 w-48 bg-white pb-6 text-left">
                          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-400">
                            Criterios
                          </span>
                        </th>
                        {items.map((item) => (
                          <th key={item.id} className="sticky top-0 z-20 min-w-[280px] bg-white px-4 pb-6">
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="group relative h-full rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:border-indigo-200 hover:bg-indigo-50/30"
                            >
                              <div className="mb-3 aspect-video overflow-hidden rounded-xl bg-slate-200">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center bg-slate-100 text-slate-400">
                                    No hay imagen
                                  </div>
                                )}
                              </div>
                              <h4 className="line-clamp-1 text-base font-extrabold text-slate-900">{item.title}</h4>
                              <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                                <MapPin className="h-3 w-3" />
                                {item.location || "Ubicación no disponible"}
                              </div>
                            </motion.div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <CompareRow
                        icon={<DollarSign className="h-4 w-4" />}
                        label="Inversión Mensual"
                        values={items.map((item) => formatMonthlyPrice(item))}
                      />
                      <CompareRow
                        icon={<Star className="h-4 w-4 text-amber-500" />}
                        label="Valoración"
                        values={items.map((item) => (
                          <div className="flex items-center gap-1.5" key={item.id}>
                            <span className="font-bold">{typeof item.rating === "number" ? item.rating.toFixed(1) : "—"}</span>
                            {typeof item.rating === "number" && (
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${i < Math.round(item.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      />
                      <CompareRow
                        icon={<Clock className="h-4 w-4" />}
                        label="Horario Académico"
                        values={items.map((item) => formatField(item.schedule))}
                      />
                      <CompareRow
                        icon={<Globe className="h-4 w-4" />}
                        label="Idiomas"
                        values={items.map((item) => formatField(item.languages))}
                      />
                      <CompareRow
                        icon={<Users className="h-4 w-4" />}
                        label="Ratio de Alumnos"
                        values={items.map((item) => formatField(item.studentsPerClass))}
                      />
                      <CompareRow
                        icon={<CalendarCheck className="h-4 w-4" />}
                        label="Status Inscripciones"
                        values={items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            {item.enrollmentOpen ? (
                              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Abiertas {item.enrollmentYear && `(${item.enrollmentYear})`}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                                <AlertCircle className="h-3.5 w-3.5" />
                                Cerradas
                              </div>
                            )}
                          </div>
                        ))}
                      />
                      {/* Fila de acciones */}
                      <tr>
                        <td className="sticky left-0 bg-white py-8"></td>
                        {items.map((item) => (
                          <td key={`action-${item.id}`} className="px-4 py-8 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                router.push(`/search/institutions/${item.id}`);
                              }}
                              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98]"
                            >
                              Ver Perfil
                              <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className="border-t border-slate-100 bg-slate-50 px-8 py-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500">
                  © {new Date().getFullYear()} Skoolia — Comparador de Instituciones Educativas
                </p>
                <div className="flex gap-4 text-xs font-bold text-indigo-600">
                  <span>Guarda tu selección</span>
                  <span>Descarga Reporte</span>
                </div>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function CompareRow({
  label,
  values,
  icon
}: {
  label: string;
  values: (string | React.ReactNode)[];
  icon?: React.ReactNode
}) {
  return (
    <tr className="group transition-colors hover:bg-slate-50/50">
      <td className="sticky left-0 z-10 bg-white py-5 pr-4 transition-colors group-hover:bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          {icon && <div className="text-slate-400 group-hover:text-indigo-600 transition-colors">{icon}</div>}
          <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">
            {label}
          </span>
        </div>
      </td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="px-4 py-5 text-sm font-medium text-slate-700">
          {typeof value === 'string' ? (
            <span className="text-slate-900">{value}</span>
          ) : (
            value
          )}
        </td>
      ))}
    </tr>
  );
}
