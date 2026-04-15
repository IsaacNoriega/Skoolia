/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CatalogCard from "@/components/layout/CatalogCard";
import FavoriteDetailModal from "@/components/parents/FavoriteDetailModal";
import SearchToolbar from "@/components/search/SearchToolbar";
import { schoolsFeedService } from "@/lib/services/services/school-feeed.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import { coursesService } from "@/lib/services/services/courses.service";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { recordSchoolVisit } from "@/lib/history/school-history";
import { useAuth } from "@/contexts/AuthContext";
import { resolveMexicanState } from "@/lib/mexico-states";
import NearbySchoolsButton from "@/components/search/NearbySchoolsButton";

type CatalogItem = {
  id: string;
  imageSrc: string;
  tags: string[];
  typeLabel: string;
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
};

export default function SearchPage() {
  const { user } = useAuth();
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const loc = sp.get("loc") ?? "";
  const near = sp.get("near") === "1";
  const latParam = sp.get("lat") ?? "";
  const lonParam = sp.get("lon") ?? "";
  const latitude = latParam ? Number(latParam) : undefined;
  const longitude = lonParam ? Number(lonParam) : undefined;
  const hasValidCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const level = sp.get("level") ?? "";
  const categoryId = sp.get("categoryId") ?? "";
  const schedule = sp.get("schedule") ?? "";
  const languages = sp.get("languages") ?? "";
  const minPriceParam = sp.get("minPrice") ?? "";
  const maxPriceParam = sp.get("maxPrice") ?? "";
  const minPrice = minPriceParam ? Number(minPriceParam) : undefined;
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : undefined;
  const sortByParam = sp.get("sortBy") ?? "recent";
  const sortBy =
    sortByParam === "favorites" || sortByParam === "rating"
      ? sortByParam
      : "recent";
  const verifiedOnly = sp.get("verified") === "1";
  const tab = (sp.get("tab") ?? "escuelas").toLowerCase();

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Cargar favoritos del usuario
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const favorites = await favoritesService.listForMe();
        if (!active) return;
        setFavoriteIds(new Set(favorites.map(f => f.id)));
      } catch (err) {
        // Usuario no autenticado o error - continuar sin favoritos
        console.log("No se pudieron cargar favoritos:", err);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSchools = async () => {
      setLoading(true);
      setError(null);
      try {
        const normalizedLoc =
          loc &&
          loc !== "México (Todas las zonas)" &&
          loc !== "Cerca de mí"
            ? (resolveMexicanState(loc) ?? undefined)
            : undefined;

        const connection = await schoolsFeedService.list({
          filters: {
            search: q || undefined,
            state: near ? undefined : normalizedLoc,
            latitude: near && hasValidCoords ? latitude : undefined,
            longitude: near && hasValidCoords ? longitude : undefined,
            educationalLevel: level || undefined,
            categoryId: categoryId || undefined,
            schedule: schedule || undefined,
            languages: languages || undefined,
            minPrice: Number.isFinite(minPrice) ? minPrice : undefined,
            maxPrice: Number.isFinite(maxPrice) ? maxPrice : undefined,
            sortBy,
            onlyVerified: verifiedOnly,
          },
          pagination: { first: 24 },
        });

        if (!active) return;

        const mapped: CatalogItem[] = connection.edges.map(({ node }) => {
          const tags: string[] = [];
          if (node.isVerified) tags.push("VERIFICADA");
          if (node.city) tags.push(node.city);

          return {
            id: node.id,
            imageSrc: node.coverImageUrl || node.logoUrl || "",
            tags,
            typeLabel: "ESCUELA",
            title: node.name,
            location: node.city || node.address || "Ubicación no disponible",
            price: node.monthlyPrice ?? "Por definir",
            description: node.description ?? undefined,
            rating: node.averageRating ?? undefined,
            schedule: undefined,
            languages: undefined,
            studentsPerClass: undefined,
            enrollmentOpen: undefined,
            enrollmentYear: undefined,
            monthlyPrice: node.monthlyPrice ?? undefined,
          };
        });
        setItems(mapped);
      } catch (err) {
        console.error(err);
        if (active) setError("No se pudieron cargar las escuelas.");
      } finally {
        if (active) setLoading(false);
      }
    };

    const loadCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        // Aquí puedes agregar filtros para cursos si tu backend los soporta
        // Por ahora, solo se listan todos los cursos públicos
        const allCourses = await coursesService.listAll();
        if (!active) return;
        const mapped: CatalogItem[] = allCourses.map((course) => ({
          id: course.id,
          imageSrc: course.coverImageUrl || "",
          tags: [course.modality || "Curso"],
          typeLabel: "CURSO",
          title: course.name,
          location: course.schoolName || "",
          price: course.price ?? "Por definir",
          description: course.description ?? undefined,
          rating: undefined,
          schedule: course.startDate ? `Inicio: ${course.startDate}` : undefined,
          languages: undefined,
          studentsPerClass: undefined,
          enrollmentOpen: undefined,
          enrollmentYear: undefined,
          monthlyPrice: undefined,
        }));
        setItems(mapped);
      } catch (err) {
        console.error(err);
        if (active) setError("No se pudieron cargar los cursos.");
      } finally {
        if (active) setLoading(false);
      }
    };

    if (tab === "cursos") {
      void loadCourses();
    } else {
      void loadSchools();
    }

    return () => {
      active = false;
    };
  }, [q, loc, near, latitude, longitude, hasValidCoords, level, categoryId, schedule, languages, minPrice, maxPrice, sortBy, verifiedOnly, tab]);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<CatalogItem | undefined>();
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
  const openModal = (item: CatalogItem) => {
    setSelected(item);
    setOpen(true);

    // Registrar visita en historial
    recordSchoolVisit(
      {
        id: item.id,
        name: item.title,
        imageSrc: item.imageSrc,
        location: item.location,
      },
      user?.id,
    );
    // si el backend expone más campos vía REST
    (async () => {
      try {
        const full = await schoolsService.getById(item.id);
        setSelected((prev) => (
          prev && prev.id === item.id
            ? {
                ...prev,
                description: full.description ?? prev.description,
                rating: full.averageRating ?? prev.rating,
                schedule: full.schedule ?? prev.schedule,
                languages: full.languages ?? prev.languages,
                studentsPerClass:
                  full.maxStudentsPerClass ?? prev.studentsPerClass,
                enrollmentOpen:
                  full.enrollmentOpen ?? prev.enrollmentOpen,
                enrollmentYear: full.enrollmentYear ?? prev.enrollmentYear,
                monthlyPrice: full.monthlyPrice ?? prev.monthlyPrice,
                // Prefer cover/logo if present
                imageSrc:
                  full.coverImageUrl || full.logoUrl || prev.imageSrc,
                location:
                  full.city || full.address || prev.location,
              }
            : prev
        ));
      } catch (e) {
        // Silencioso: mantenemos datos del feed
        console.warn('No se pudo cargar detalle de la escuela', e);
      }
    })();
  };

  const handleFavoriteToggle = async (schoolId: string, e?: React.MouseEvent) => {
    // Evitar que el click se propague al card
    e?.stopPropagation();
    
    try {
      const result = await favoritesService.toggle(schoolId);
      
      // Actualizar el estado local optimistamente
      setFavoriteIds(prev => {
        const newSet = new Set(prev);
        if (result.isFavorite) {
          newSet.add(schoolId);
        } else {
          newSet.delete(schoolId);
        }
        return newSet;
      });
    } catch (err) {
      console.error("Error al actualizar favorito:", err);
      // Aquí podrías mostrar un toast de error
    }
  };

  return (
    <>
      <SearchToolbar
        q={q}
        loc={loc || "México (Todas las zonas)"}
        near={near}
        latitude={hasValidCoords ? latitude : undefined}
        longitude={hasValidCoords ? longitude : undefined}
        level={level}
        categoryId={categoryId}
        schedule={schedule}
        languages={languages}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sortBy={sortBy}
        verified={verifiedOnly}
      />
      <section className="mx-auto max-w-7xl px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-extrabold tracking-widest text-indigo-600">
            <span className="grid h-2 w-2 place-items-center rounded-full bg-indigo-600" /> ENCONTRADOS
          </p>
          <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
            {loading ? "Cargando escuelas..." : `${items.length} Escuelas disponibles`}
          </h1>
          {q || loc ? (
            <p className="mt-1 text-sm text-slate-600">
              Mostrando resultados para {q ? `"${q}"` : "todos"}{loc ? ` en ${loc}` : ""}
            </p>
          ) : null}
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-slate-600">Mostrando resultados para <span className="font-semibold">{q || "Educación"}</span></p>
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {items.map((it) => (
          <CatalogCard
            priceFormatted={""} key={it.id}
            {...it}
            isFavorite={favoriteIds.has(it.id)}
            onFavoriteToggle={(e) => handleFavoriteToggle(it.id, e)}
            onCardClick={() => openModal(it)}
            onAction={() => openModal(it)}          />
        ))}
      </div>

      <div className="mb-6 flex justify-end">
        <NearbySchoolsButton
          onResults={(schools) => {
            setItems(
              schools.map((node) => ({
                id: node.id,
                imageSrc: node.coverImageUrl || node.logoUrl || "",
                tags: [node.city, ...(node.isVerified ? ["VERIFICADA"] : [])].filter(Boolean),
                typeLabel: "ESCUELA",
                title: node.name,
                location: node.city || node.address || "Ubicación no disponible",
                price: node.monthlyPrice ?? "Por definir",
                description: node.description ?? undefined,
                rating: node.averageRating ?? undefined,
                // ...otros campos si los necesitas
              }))
            );
          }}
        />
      </div>

      {error ? (
        <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600">
          No encontramos escuelas con esos filtros. Intenta ajustar estado, nivel o rango de precio.
        </div>
      ) : null}

      <FavoriteDetailModal
        open={open}
        onClose={() => setOpen(false)}
        onRatingUpdated={handleRatingUpdated}
        item={
          selected && {
            id: selected.id,
            imageUrl: selected.imageSrc,
            badges: selected.tags,
            level: selected.typeLabel,
            title: selected.title,
            location: selected.location,
            price: selected.price,
            description: selected.description,
            rating: selected.rating,
            schedule: selected.schedule,
            languages: selected.languages,
            studentsPerClass: selected.studentsPerClass,
            enrollmentOpen: selected.enrollmentOpen,
            enrollmentYear: selected.enrollmentYear,
            monthlyPrice: selected.monthlyPrice,
          }
        }
      />
      <NearbySchoolsButton
        lat={latitude}
        lon={longitude}
        near={near}
        hasValidCoords={hasValidCoords}
      />
    </section>
    </>
  );
}
