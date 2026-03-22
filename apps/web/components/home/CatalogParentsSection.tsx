"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getSchoolHistory } from "@/lib/history/school-history";
import { schoolsFeedService, type SchoolNode } from "@/lib/services/services/school-feeed.service";
import { studentService } from "@/lib/services/services/student.service";
import { coursesService } from "@/lib/services/services/courses.service";
import { favoritesService } from "@/lib/services/services/favorites.service";
import CatalogCard from "../layout/CatalogCard";

type FilterKey = "Nivel" | "Categorias" | "Ciudades" | "Cursos" | "Recomendado";

type CatalogItem = {
  id: string;
  imageSrc: string;
  tags: string[];
  typeLabel: string;
  title: string;
  location: string;
  price: number | string;
  priceFormatted: string;
  href: string;
};

type RecommendationBuckets = Record<FilterKey, CatalogItem[]>;

type UserCoords = {
  latitude: number;
  longitude: number;
};

const FILTERS: FilterKey[] = ["Nivel", "Categorias", "Ciudades", "Cursos", "Recomendado"];

function formatPrice(price: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(price);
}

function normalizeCity(location?: string): string | undefined {
  if (!location) return undefined;
  const trimmed = location.trim();
  if (!trimmed) return undefined;

  const parts = trimmed
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    return parts[parts.length - 1];
  }

  return trimmed;
}

function normalizeCityLabel(city?: string): string | undefined {
  if (!city) return undefined;

  const normalized = city
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

  if (!normalized) return undefined;
  if (normalized === "cdmx" || normalized === "ciudad de mexico" || normalized === "df") {
    return "ciudad de mexico";
  }

  return normalized;
}

function inferEducationalLevel(age?: number): string | undefined {
  if (!age || age < 3) return undefined;
  if (age <= 5) return "Preescolar";
  if (age <= 11) return "Primaria";
  if (age <= 14) return "Secundaria";
  if (age <= 18) return "Preparatoria";
  return "Universidad";
}

function buildCatalogItem(node: SchoolNode): CatalogItem {
  const tags: string[] = [];
  if (node.isVerified) tags.push("Verificada");
  if (node.city) tags.push(node.city);

  const location = node.city || node.address || "Ubicación no disponible";
  const price = node.monthlyPrice ?? "Por definir";

  return {
    id: node.id,
    imageSrc: node.coverImageUrl || node.logoUrl || "",
    tags,
    typeLabel: "ESCUELA",
    title: node.name,
    location,
    price,
    priceFormatted:
      typeof node.monthlyPrice === "number"
        ? formatPrice(node.monthlyPrice)
        : "Por definir",
    href: `/search?q=${encodeURIComponent(node.name)}`,
  };
}

export default function CatalogSection() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterKey>("Recomendado");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [pageStart, setPageStart] = useState(0);
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [buckets, setBuckets] = useState<RecommendationBuckets>({
    Nivel: [],
    Categorias: [],
    Ciudades: [],
    Cursos: [],
    Recomendado: [],
  });

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const favorites = await favoritesService.listForMe();
        if (!active) return;
        setFavoriteIds(new Set(favorites.map((favorite) => favorite.id)));
      } catch {
        if (!active) return;
        setFavoriteIds(new Set());
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        setUserCoords(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 1000 * 60 * 15,
      },
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function safeFeed(filters?: {
      educationalLevel?: string;
      city?: string;
      categoryId?: string;
      sortBy?: "favorites" | "rating" | "recent";
      latitude?: number;
      longitude?: number;
    }) {
      try {
        return await schoolsFeedService.list({
          filters,
          pagination: { first: 20 },
        });
      } catch {
        return { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };
      }
    }

    async function loadRecommendations() {
      setLoading(true);
      setError(null);

      try {
        const [student, ratingFeed, favoritesFeed, recentFeed] = await Promise.all([
          studentService.getMyStudent().catch(() => null),
          safeFeed({ sortBy: "rating" }),
          safeFeed({ sortBy: "favorites" }),
          safeFeed({ sortBy: "recent" }),
        ]);

        if (!active) return;

        const history = getSchoolHistory(user?.id);
        const historyIds = new Set(history.map((visit) => visit.id));

        const historyCityStats = new Map<string, { count: number; raw: string }>();
        history.forEach((visit) => {
          const rawCity = normalizeCity(visit.location);
          const cityLabel = normalizeCityLabel(rawCity);
          if (!rawCity || !cityLabel) return;

          const current = historyCityStats.get(cityLabel);
          if (!current) {
            historyCityStats.set(cityLabel, { count: 1, raw: rawCity });
            return;
          }

          historyCityStats.set(cityLabel, {
            ...current,
            count: current.count + 1,
          });
        });

        const topHistoryCityEntry = [...historyCityStats.entries()].sort(
          (a, b) => b[1].count - a[1].count,
        )[0];
        const topHistoryCityLabel = topHistoryCityEntry?.[0];
        const topHistoryCityRaw = topHistoryCityEntry?.[1].raw;

        const inferredLevel = inferEducationalLevel(student?.age);
        const levelFeed = inferredLevel
          ? await safeFeed({ educationalLevel: inferredLevel, sortBy: "rating" })
          : { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

        const cityFeed = topHistoryCityRaw
          ? await safeFeed({ city: topHistoryCityRaw, sortBy: "rating" })
          : { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

        const nearbyFeed = userCoords
          ? await safeFeed({
              latitude: userCoords.latitude,
              longitude: userCoords.longitude,
              sortBy: "rating",
            })
          : { edges: [], pageInfo: { hasNextPage: false, endCursor: null } };

        const nearbyCityStats = new Map<string, number>();
        nearbyFeed.edges.forEach(({ node }) => {
          const cityLabel = normalizeCityLabel(node.city ?? undefined);
          if (!cityLabel) return;
          nearbyCityStats.set(cityLabel, (nearbyCityStats.get(cityLabel) ?? 0) + 1);
        });

        const topNearbyCityLabel = [...nearbyCityStats.entries()].sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];

        const interestCategoryIds = (student?.interests ?? [])
          .map((interest) => interest.id)
          .filter(Boolean)
          .slice(0, 3);

        const categoryFeeds = await Promise.all(
          interestCategoryIds.map((categoryId) =>
            safeFeed({ categoryId, sortBy: "rating" }),
          ),
        );

        const allNodesMap = new Map<string, SchoolNode>();
        const allFeedEdges = [
          ...ratingFeed.edges,
          ...favoritesFeed.edges,
          ...recentFeed.edges,
          ...levelFeed.edges,
          ...cityFeed.edges,
          ...nearbyFeed.edges,
          ...categoryFeeds.flatMap((feed) => feed.edges),
        ];

        allFeedEdges.forEach(({ node }) => {
          allNodesMap.set(node.id, node);
        });

        const allNodes = Array.from(allNodesMap.values());
        const levelIds = new Set(levelFeed.edges.map(({ node }) => node.id));
        const targetCityLabel = topHistoryCityLabel ?? topNearbyCityLabel;
        const cityIds = new Set(
          allNodes
            .filter((node) => {
              if (!targetCityLabel) return false;
              return normalizeCityLabel(node.city ?? undefined) === targetCityLabel;
            })
            .map((node) => node.id),
        );
        const categoryIds = new Set(
          categoryFeeds.flatMap((feed) => feed.edges.map(({ node }) => node.id)),
        );

        const courseChecks = await Promise.allSettled(
          allNodes.slice(0, 30).map((node) => coursesService.listBySchoolId(node.id)),
        );

        if (!active) return;

        const coursesIds = new Set<string>();
        courseChecks.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value.length > 0) {
            const schoolId = allNodes[index]?.id;
            if (schoolId) coursesIds.add(schoolId);
          }
        });

        const allItems = allNodes.map(buildCatalogItem);
        const allItemsMap = new Map(allItems.map((item) => [item.id, item]));

        const bySet = (ids: Set<string>) =>
          Array.from(ids)
            .map((id) => allItemsMap.get(id))
            .filter((item): item is CatalogItem => Boolean(item));

        const recommendationScores = new Map<string, number>();
        allNodes.forEach((node) => {
          const baseScore =
            (node.averageRating || 0) * 2 + (node.favoritesCount || 0) * 0.1;
          recommendationScores.set(node.id, baseScore);
        });

        const boostSet = (ids: Set<string>, weight: number) => {
          ids.forEach((id) => {
            recommendationScores.set(id, (recommendationScores.get(id) ?? 0) + weight);
          });
        };

        boostSet(levelIds, 3);
        boostSet(categoryIds, 3);
        boostSet(cityIds, 4);
        boostSet(coursesIds, 2);
        boostSet(historyIds, 4);

        if (cityIds.size > 0) {
          allNodes.forEach((node) => {
            if (!cityIds.has(node.id)) {
              recommendationScores.set(
                node.id,
                (recommendationScores.get(node.id) ?? 0) - 3,
              );
            }
          });
        }

        allNodes.forEach((node) => {
          if (node.isVerified) {
            recommendationScores.set(
              node.id,
              (recommendationScores.get(node.id) ?? 0) + 1,
            );
          }
        });

        const recommended = [...allItems].sort(
          (a, b) =>
            (recommendationScores.get(b.id) ?? 0) -
            (recommendationScores.get(a.id) ?? 0),
        );
        const recommendedSameCity =
          cityIds.size > 0 ? recommended.filter((item) => cityIds.has(item.id)) : recommended;

        const nextBuckets: RecommendationBuckets = {
          Nivel: bySet(levelIds).slice(0, 9),
          Categorias: bySet(categoryIds).slice(0, 9),
          Ciudades: bySet(cityIds).slice(0, 9),
          Cursos: bySet(coursesIds).slice(0, 9),
          Recomendado: recommendedSameCity.slice(0, 9),
        };

        if (nextBuckets.Recomendado.length === 0) {
          nextBuckets.Recomendado = recommended.slice(0, 9);
        }

        (['Nivel', 'Categorias', 'Cursos'] as const).forEach((filter) => {
          if (nextBuckets[filter].length === 0) {
            nextBuckets[filter] = nextBuckets.Recomendado;
          }
        });

        setBuckets(nextBuckets);
      } catch (loadError) {
        console.error(loadError);
        if (active) {
          setError("No pudimos cargar recomendaciones en este momento.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadRecommendations();

    return () => {
      active = false;
    };
  }, [user?.id, userCoords]);

  const items = useMemo(() => buckets[activeFilter] ?? [], [activeFilter, buckets]);
  const visibleItems = useMemo(
    () => items.slice(pageStart, pageStart + itemsPerPage),
    [items, pageStart, itemsPerPage],
  );
  const canGoBack = pageStart > 0;
  const canGoNext = pageStart + itemsPerPage < items.length;

  useEffect(() => {
    const computeItemsPerPage = () => {
      if (window.innerWidth < 768) return 1;
      if (window.innerWidth < 1200) return 2;
      return 3;
    };

    const updateItemsPerPage = () => {
      setItemsPerPage(computeItemsPerPage());
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);

    return () => {
      window.removeEventListener("resize", updateItemsPerPage);
    };
  }, []);

  useEffect(() => {
    setPageStart(0);
  }, [activeFilter]);

  useEffect(() => {
    if (pageStart >= items.length) {
      const nextStart = Math.max(0, items.length - itemsPerPage);
      setPageStart(nextStart);
    }
  }, [items.length, itemsPerPage, pageStart]);

  const handleFavoriteToggle = async (schoolId: string) => {
    try {
      const result = await favoritesService.toggle(schoolId);

      setFavoriteIds((previous) => {
        const next = new Set(previous);
        if (result.isFavorite) {
          next.add(schoolId);
        } else {
          next.delete(schoolId);
        }
        return next;
      });
    } catch (toggleError) {
      console.error("No se pudo actualizar favorito", toggleError);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-6 py-16 text-center flex flex-col items-center">
      {/* TITLE */}
      <h2 className="text-5xl md:text-6xl font-bold text-[#2D2C2B]">
        Recomendado para <br /> tu familia
      </h2>

      {/* FILTERS */}
      <div className="flex flex-wrap justify-center gap-4 mt-10 max-w-5xl">
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter;

          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`
                flex items-center gap-3
                px-8 h-12 rounded-full text-lg font-semibold
                transition-all duration-300
                ${
                  isActive
                    ? "bg-[#2D2C2B] text-white"
                    : "bg-[#f3f3f3] text-black hover:bg-gray-200"
                }
              `}
            >
              {isActive && <span className="w-3 h-3 rounded-full bg-white" />}
              {filter}
            </button>
          );
        })}
      </div>

      <section className="w-full max-w-7xl mx-auto px-6 mt-10">
        {loading ? (
          <div className="grid gap-8 md:grid-cols-3">
            {[1, 2, 3].map((skeleton) => (
              <div
                key={skeleton}
                className="h-96 rounded-3xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!loading && !error ? (
          <div className="space-y-6">
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                aria-label="Anterior"
                disabled={!canGoBack}
                onClick={() => setPageStart((value) => Math.max(0, value - itemsPerPage))}
                className="h-11 w-11 rounded-full border border-slate-300 bg-white text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-500"
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                disabled={!canGoNext}
                onClick={() =>
                  setPageStart((value) =>
                    Math.min(value + itemsPerPage, Math.max(0, items.length - itemsPerPage)),
                  )
                }
                className="h-11 w-11 rounded-full border border-slate-300 bg-white text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40 hover:border-slate-500"
              >
                →
              </button>
            </div>

            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((item) => (
                <CatalogCard
                  key={item.id}
                  imageSrc={item.imageSrc}
                  tags={item.tags}
                  typeLabel={item.typeLabel}
                  title={item.title}
                  location={item.location}
                  price={item.price}
                  priceFormatted={item.priceFormatted}
                  href={item.href}
                  isFavorite={favoriteIds.has(item.id)}
                  onFavoriteToggle={() => handleFavoriteToggle(item.id)}
                  onCardClick={() => router.push(item.href)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {!loading && !error && items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            No hay resultados para este filtro todavía.
          </div>
        ) : null}
      </section>
    </section>
  );
}
