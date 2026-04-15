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
import dynamic from "next/dynamic";
const SchoolsMap = dynamic(() => import("@/components/onboarding/SchoolsMap"), { ssr: false });

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

  const statItems = [
    {
      label: "Años",
      value: school.enrollmentYear ? `${new Date().getFullYear() - school.enrollmentYear + 1}+` : "10+",
    },
    {
      label: "Reseñas",
      value: String(school.ratingsCount),
    },
    {
      label: "Favoritos",
      value: String(school.favoritesCount),
    },
  ];

  const philosophyItems = [
    school.educationalLevel || "Formación integral por niveles",
    school.institutionType || "Experiencia educativa personalizada",
    school.languages || "Acompañamiento académico y humano",
    school.schedule || "Aprendizaje con estructura y flexibilidad",
  ].filter(Boolean) as string[];

  const storyCardTitle = school.isFeatured ? "Escuela destacada" : "Nuestra propuesta";
  const storyCardText = school.description
    ? school.description
    : "Esta institución está construyendo una propuesta educativa enfocada en acompañar a familias con una experiencia clara, moderna y cercana.";

  return (
    <section className="relative mx-auto max-w-7xl space-y-8 px-6 py-8">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur transition hover:bg-white"
      >
        <ArrowLeft className="h-4 w-4" /> Volver
      </button>

      <div className="text-center">
        <p className="text-[11px] font-extrabold tracking-[0.35em] text-indigo-600">
          PERFIL DE INSTITUCIÓN
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          {school.name}
        </h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          {school.educationalLevel || "Nivel educativo"} · {school.institutionType || "Tipo de institución"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.05fr]">
        <aside className="lg:self-start">
          <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_18px_45px_-24px_rgba(15,23,42,0.35)]">
            <div className="relative h-[560px] w-full bg-slate-100">
              {galleryItems[activeImageIndex]?.src ? (
                <Image
                  src={galleryItems[activeImageIndex].src!}
                  alt={`${galleryItems[activeImageIndex].label} de ${school.name}`}
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className={galleryItems[activeImageIndex].fit === "cover" ? "object-cover" : "object-contain p-8"}
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow-lg transition hover:bg-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Imagen siguiente"
                    onClick={() => setActiveImageIndex((prev) => (prev + 1) % galleryItems.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-slate-700 shadow-lg transition hover:bg-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : null}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
              <p className="text-xs font-extrabold tracking-widest text-slate-500">
                {galleryItems[activeImageIndex]?.label.toUpperCase()}
              </p>
              <p className="text-xs font-semibold text-slate-400">
                {Math.min(activeImageIndex + 1, galleryItems.length)} / {galleryItems.length}
              </p>
            </div>

            <div className="flex items-center gap-2 px-5 pb-5">
              {galleryItems.map((item, index) => (
                <button
                  key={`${item.label}-${index}`}
                  type="button"
                  onClick={() => setActiveImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${index === activeImageIndex ? "w-8 bg-slate-900" : "w-2 bg-slate-300 hover:bg-slate-400"}`}
                  aria-label={`Ver ${item.label}`}
                />
              ))}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <p className="text-[11px] font-extrabold tracking-widest text-slate-500">
                  {storyCardTitle}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {storyCardText}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-8">
          <div className="border-b border-slate-200 pb-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold tracking-widest text-slate-500">
              <span className="text-indigo-700">INSTITUCIÓN</span>
              {school.isVerified ? <span>• VERIFICADA</span> : null}
              {school.isFeatured ? <span>• DESTACADA</span> : null}
            </div>

            <div className="mt-5 flex items-start justify-between gap-4">
              <div className="max-w-3xl">
                <h2 className="text-3xl font-extrabold leading-tight text-slate-900 sm:text-[36px]">
                  {school.name}
                </h2>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4" /> {school.city || school.address || "Ubicación no disponible"}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-400" /> {school.averageRating.toFixed(1)} ({school.ratingsCount} reseñas)
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 text-slate-700 sm:text-[15px]">
                  {school.description || "Esta institución no ha agregado descripción aún."}
                </p>
              </div>
              <button
                onClick={handleToggleFavorite}
                disabled={togglingFav}
                className="rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:bg-slate-50 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Agregar a favoritos"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-700"}`} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <InfoCard title="Horario" value={school.schedule || "Por definir"} icon={<Clock3 className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Idiomas" value={school.languages || "Por definir"} icon={<Languages className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Alumnos por salón" value={school.maxStudentsPerClass != null ? String(school.maxStudentsPerClass) : "Por definir"} icon={<Users className="h-4 w-4 text-indigo-600" />} />
            <InfoCard title="Inscripciones" value={enrollmentText} icon={<ClipboardCheck className="h-4 w-4 text-indigo-600" />} />
          </div>

          <div className="border-b border-slate-200 pb-8">
            <h3 className="text-2xl font-extrabold text-slate-900">Mi filosofía</h3>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-slate-700">
              {philosophyItems.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 rounded-full bg-indigo-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {statItems.map((stat) => (
              <div key={stat.label} className="border-t border-slate-200 pt-4 text-center">
                <p className="text-3xl font-extrabold text-slate-900 sm:text-[34px]">{stat.value}</p>
                <p className="mt-1 text-[11px] font-bold tracking-[0.35em] text-slate-500 uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8">
        <h3 className="text-2xl font-extrabold text-slate-900">Información completa</h3>
        <div className="mt-4 space-y-3">
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

      <div className="border-t border-slate-200 pt-8">
        <h3 className="text-2xl font-extrabold text-slate-900">Ofertas académicas</h3>
        <div className="mt-4 space-y-3">
          {courses.length === 0 ? (
            <p className="text-sm text-slate-500">Esta escuela aún no tiene ofertas publicadas.</p>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="border-b border-slate-100 px-0 py-4 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">{course.name}</p>
                  <span className="text-[11px] font-bold tracking-widest text-slate-500">
                    {course.modality || "Modalidad por definir"}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-600">
                  ${course.price.toLocaleString()} MXN{course.capacity ? ` · ${course.capacity} cupos` : ""}
                </p>
                {course.description ? (
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">{course.description}</p>
                ) : null}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-8">
        <h3 className="text-2xl font-extrabold text-slate-900">Reseñas recientes</h3>
        <div className="mt-4 space-y-3">
          {ratings.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no hay reseñas públicas.</p>
          ) : (
            ratings.map((rating) => (
              <div key={rating.id} className="border-b border-slate-100 py-4 last:border-b-0">
                <p className="text-sm font-bold text-slate-900">{rating.rating.toFixed(1)} / 5</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{rating.comment || "Sin comentario"}</p>
                <p className="mt-1 text-[11px] text-slate-400">{new Date(rating.createdAt).toLocaleDateString("es-MX")}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAPA DE LA ESCUELA */}
      {school.latitude && school.longitude && (
        <div className="my-8">
          <h3 className="text-lg font-semibold mb-2">Ubicación en el mapa</h3>
          <div className="w-full" style={{ minHeight: 320 }}>
            <SchoolsMap
              schools={[{
                id: school.id,
                name: school.name,
                lat: school.latitude,
                lng: school.longitude,
                level: school.educationalLevel ?? undefined,
              }]}
              height={320}
            />
          </div>
        </div>
      )}
        {/* MAPA DE LA ESCUELA */}
        {school.latitude && school.longitude && (
          <div className="my-8">
            <h3 className="text-lg font-semibold mb-2">Ubicación en el mapa</h3>
            <div className="w-full" style={{ minHeight: 320 }}>
              <SchoolsMap
                schools={[{
                  id: school.id,
                  name: school.name,
                  lat: school.latitude,
                  lng: school.longitude,
                  level: school.educationalLevel,
                }]}
                height={320}
              />
            </div>
          </div>
        )}
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
    <div className="border-t border-slate-200 pt-4">
      <div className="flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-slate-500">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-[10px] font-extrabold tracking-widest text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
