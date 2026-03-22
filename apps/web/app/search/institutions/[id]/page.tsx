"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock3,
  Languages,
  Users,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
} from "lucide-react";

import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { schoolRatingsService, type SchoolRating } from "@/lib/services/services/rating.service";
import { favoritesService } from "@/lib/services/services/favorites.service";

export default function InstitutionDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const schoolId = params?.id;

  const [school, setSchool] = useState<School | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ratings, setRatings] = useState<SchoolRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);

  useEffect(() => {
    if (!schoolId) return;

    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [schoolData, coursesData, ratingsData] = await Promise.all([
          schoolsService.getById(schoolId),
          coursesService.listBySchoolId(schoolId),
          schoolRatingsService.list({ schoolId, page: 1, pageSize: 20 }),
        ]);

        if (!mounted) return;

        setSchool(schoolData);
        setCourses(coursesData);
        setRatings(ratingsData);
      } catch (err) {
        if (!mounted) return;
        console.error("No se pudo cargar el detalle de la institucion", err);
        setError("No se pudo cargar la informacion de la institucion.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [schoolId]);

  const enrollmentText = useMemo(() => {
    if (!school) return "Por definir";
    if (school.enrollmentOpen) {
      return `Abiertas${school.enrollmentYear ? ` ${school.enrollmentYear}` : ""}`;
    }
    return "Cerradas";
  }, [school]);

  const galleryItems = useMemo(() => {
    if (!school) return [] as Array<{ label: string; src: string | null; fit: "cover" | "contain" }>;

    const items: Array<{ label: string; src: string | null; fit: "cover" | "contain" }> = [];

    if (school.coverImageUrl) {
      items.push({ label: "Portada", src: school.coverImageUrl, fit: "cover" });
    }
    if (school.logoUrl) {
      items.push({ label: "Logo", src: school.logoUrl, fit: "contain" });
    }
    if (items.length === 0) {
      items.push({ label: "Imagen", src: null, fit: "cover" });
    }

    return items;
  }, [school]);

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [schoolId]);

  useEffect(() => {
    if (activeImageIndex >= galleryItems.length) {
      setActiveImageIndex(0);
    }
  }, [activeImageIndex, galleryItems.length]);

  const handleToggleFavorite = async () => {
    if (!schoolId || togglingFav) return;

    try {
      setTogglingFav(true);
      const result = await favoritesService.toggle(schoolId);
      setIsFavorite(result.isFavorite);
    } catch (err) {
      console.error("Error al cambiar favorito", err);
    } finally {
      setTogglingFav(false);
    }
  };

  if (loading) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-8">
        <p className="text-sm text-slate-600">Cargando información...</p>
      </section>
    );
  }

  if (error || !school) {
    return (
      <section className="mx-auto max-w-6xl px-6 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" /> Volver
        </button>
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error ?? "No se encontró la institución."}
        </p>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-6 py-8 space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-95 w-full bg-slate-100">
              {galleryItems[activeImageIndex]?.src ? (
                <Image
                  src={galleryItems[activeImageIndex].src!}
                  alt={`${galleryItems[activeImageIndex].label} de ${school.name}`}
                  fill
                  sizes="(min-width: 1024px) 340px, 100vw"
                  className={galleryItems[activeImageIndex].fit === "cover" ? "object-cover" : "object-contain p-6"}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                  Sin imágenes disponibles
                </div>
              )}

              {galleryItems.length > 1 ? (
                <>
                  <button
                    type="button"
                    aria-label="Imagen anterior"
                    onClick={() => setActiveImageIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % galleryItems.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
              <p className="text-xs font-extrabold tracking-widest text-slate-500">
                {galleryItems[activeImageIndex]?.label.toUpperCase()}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {Math.min(activeImageIndex + 1, galleryItems.length)} / {galleryItems.length}
              </p>
            </div>

            <div className="flex items-center gap-2 px-4 pb-4">
              {galleryItems.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeImageIndex ? "w-8 bg-slate-900" : "w-2 bg-slate-300"}`}
                  aria-label={`Ver ${item.label}`}
                />
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold tracking-widest text-slate-500">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">INSTITUCIÓN</span>
              {school.isVerified ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">VERIFICADA</span>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-extrabold text-slate-900">{school.name}</h1>
              <button
                onClick={handleToggleFavorite}
                disabled={togglingFav}
                className="rounded-full border border-slate-300 bg-white p-3 text-slate-700 shadow hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
                aria-label="Agregar a favoritos"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-700"}`} />
              </button>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {school.city || school.address || "Ubicación no disponible"}
              </span>
              <span className="inline-flex items-center gap-1">
                <Star className="h-4 w-4 text-amber-400" /> {school.averageRating.toFixed(1)} ({school.ratingsCount} reseñas)
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-700">
              {school.description || "Esta institución no ha agregado descripción aún."}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <InfoCard title="Horario" value={school.schedule || "Por definir"} icon={<Clock3 className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Idiomas" value={school.languages || "Por definir"} icon={<Languages className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Alumnos por salón" value={school.maxStudentsPerClass != null ? String(school.maxStudentsPerClass) : "Por definir"} icon={<Users className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Inscripciones" value={enrollmentText} icon={<ClipboardCheck className="h-4 w-4 text-indigo-600" />} />
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900">Información completa</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Row label="Nivel educativo" value={school.educationalLevel || "Por definir"} />
              <Row label="Tipo de institución" value={school.institutionType || "Por definir"} />
              <Row label="Precio mensual" value={school.monthlyPrice != null ? `$${school.monthlyPrice.toLocaleString()} MXN` : "Por definir"} />
              <Row label="Dirección" value={school.address || "Por definir"} />
              <Row label="Ciudad" value={school.city || "Por definir"} />
              <Row label="Latitud" value={school.latitude != null ? String(school.latitude) : "Por definir"} />
              <Row label="Longitud" value={school.longitude != null ? String(school.longitude) : "Por definir"} />
              <Row label="Escuela destacada" value={school.isFeatured ? "Sí" : "No"} />
              <Row label="Favoritos" value={String(school.favoritesCount)} />
              <Row label="Ranking" value={String(school.rankingScore)} />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900">Ofertas académicas</h2>
        <div className="mt-4 space-y-3">
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500">Esta escuela aún no tiene ofertas publicadas.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">{course.name}</p>
                <p className="mt-1 text-xs text-slate-600">
                  {course.modality || "Modalidad por definir"} · ${course.price.toLocaleString()} MXN
                  {course.capacity ? ` · ${course.capacity} cupos` : ""}
                </p>
                {course.description ? (
                  <p className="mt-2 text-xs text-slate-600">{course.description}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-900">Reseñas recientes</h2>
        <div className="mt-4 space-y-3">
          {ratings.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay reseñas públicas.</p>
          ) : (
            ratings.map((rating) => (
              <div key={rating.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-sm font-bold text-slate-900">{rating.rating.toFixed(1)} / 5</p>
                <p className="mt-1 text-xs text-slate-600">{rating.comment || "Sin comentario"}</p>
                <p className="mt-1 text-[11px] text-slate-400">{new Date(rating.createdAt).toLocaleDateString("es-MX")}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-slate-500">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-2 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-[11px] font-extrabold tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
