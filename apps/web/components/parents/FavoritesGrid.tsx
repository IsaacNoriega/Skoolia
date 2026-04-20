"use client";
import { useEffect, useMemo, useState } from "react";
import CatalogCard from "../layout/CatalogCard";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import FavoritesEmptyState from "./FavoritesEmptyState";
import FavoriteDetailModal from "./FavoriteDetailModal";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { schoolsService } from "@/lib/services/services/schools.service";
import { resolveSchoolCardImage } from "@/lib/utils";

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
};

export default function FavoritesGrid() {
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
        const mapped: FavoriteItem[] = data.map((s) => ({
          id: s.id,
          imageUrl: resolveSchoolCardImage(s.id, s.coverImageUrl),
          title: s.name,
          location: s.city ?? "",
          price: s.monthlyPrice ?? "N/A",
        }));
        setItems(mapped);
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const openModal = (item: FavoriteItem) => {
    setSelected(item);
    setOpen(true);
    
    // Enriquecer datos del modal con detalles completos
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
                studentsPerClass: full.maxStudentsPerClass ?? prev.studentsPerClass,
                enrollmentOpen: full.enrollmentOpen ?? prev.enrollmentOpen,
                enrollmentYear: full.enrollmentYear ?? prev.enrollmentYear,
                monthlyPrice: full.monthlyPrice ?? prev.monthlyPrice,
                imageUrl: resolveSchoolCardImage(item.id, full.coverImageUrl, full.logoUrl, prev.imageUrl),
                location: full.city || full.address || prev.location,
              }
            : prev
        ));
      } catch (e) {
        console.warn('No se pudo cargar detalle de la escuela', e);
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
            const full = await schoolsService.getById(id);
            return {
              id,
              data: {
                id,
                imageUrl: resolveSchoolCardImage(id, full.coverImageUrl, full.logoUrl),
                title: full.name,
                location: full.city || full.address || "",
                price: full.monthlyPrice ?? "N/A",
                description: full.description ?? undefined,
                rating: full.averageRating ?? undefined,
                schedule: full.schedule ?? undefined,
                languages: full.languages ?? undefined,
                studentsPerClass: full.maxStudentsPerClass ?? undefined,
                enrollmentOpen: full.enrollmentOpen,
                enrollmentYear: full.enrollmentYear ?? undefined,
                monthlyPrice: full.monthlyPrice ?? undefined,
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

  const gridContent = useMemo(() => {
    if (loading) {
      return <p className="text-sm text-slate-600">Cargando favoritos…</p>;
    }
    if (!items.length) {
      return <FavoritesEmptyState />;
    }
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {items.map((item) => {
          const isComparing = compareIds.includes(item.id);

          return (
            <div key={item.id} className="relative">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleCompare(item.id);
                }}
                className={`absolute left-4 top-4 z-20 rounded-full px-3 py-1 text-[11px] font-bold shadow-sm ring-1 ${
                  isComparing
                    ? "bg-indigo-600 text-white ring-indigo-600"
                    : "bg-white text-slate-700 ring-slate-200"
                }`}
                aria-pressed={isComparing}
              >
                {isComparing ? "Seleccionada" : "Comparar"}
              </button>

              <CatalogCard
                imageSrc={item.imageUrl ?? undefined}
                imageAlt={item.title}
                typeLabel={"INSTITUCIÓN"}
                title={item.title}
                location={item.location}
                priceLabel="MENSUALIDAD"
                price={item.price}
                onCardClick={async () => {
                  openModal(item);
                  if (user?.id) {
                    await trackLead({
                      targetId: item.id,
                      originType: "SCHOOL",
                      trigger: "VIEW_MORE",
                      status: "INTERESADO",
                    });
                  }
                }}
                onAction={() => openModal(item)}
                isFavorite={true}
                className={isComparing ? "ring-2 ring-indigo-500" : ""}
                onFavoriteToggle={async () => {
                  await favoritesService.toggle(item.id);
                  if (user?.id) {
                    const leadPayload = {
                      targetId: item.id,
                      originType: "SCHOOL",
                      trigger: "FAVORITE",
                      status: "INTERESADO",
                    };
                    console.log("[Favoritos] Enviando a trackLead:", { userId: user.id, ...leadPayload });
                    const leadResult = await trackLead({ ...leadPayload });
                    console.log("[Favoritos] Respuesta de trackLead:", leadResult);
                  }
                  // optimistically remove from list
                  setItems((prev) => prev.filter((x) => x.id !== item.id));
                  setCompareIds((prev) => prev.filter((id) => id !== item.id));
                  setCompareDetails((prev) => {
                    if (!prev[item.id]) return prev;
                    const next = { ...prev };
                    delete next[item.id];
                    return next;
                  });
                }}
                priceFormatted={""}
              />
            </div>
          );
        })}
      </div>
    );
  }, [items, loading]);

  return (
    <>
      {items.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm font-semibold text-slate-700">
            Comparador: {compareIds.length}/3 seleccionadas (mínimo 2)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCompare}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              disabled={!compareIds.length}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => void openCompareModal()}
              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-60"
              disabled={compareIds.length < 2}
            >
              Comparar escuelas
            </button>
          </div>
        </div>
      ) : null}

      {gridContent}

      <FavoriteDetailModal
        open={open}
        onClose={() => setOpen(false)}
        onRatingUpdated={handleRatingUpdated}
        item={
          selected && {
            id: selected.id,
            imageUrl: selected.imageUrl ?? undefined,
            badges: [],
            level: "INSTITUCIÓN",
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
          }
        }
      />

      <SchoolCompareModal
        open={compareOpen}
        items={compareItems}
        loading={loadingCompare}
        onClose={() => setCompareOpen(false)}
      />
    </>
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
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-121 w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Comparador de escuelas</h3>
            <p className="text-xs text-slate-500">Vista rápida para decidir mejor entre tus guardadas.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            Cerrar
          </button>
        </header>

        <div className="max-h-[70vh] overflow-auto p-5 sm:p-6">
          {loading ? (
            <p className="text-sm text-slate-600">Cargando datos de comparación…</p>
          ) : null}

          {!loading && items.length < 2 ? (
            <p className="text-sm text-slate-600">Selecciona al menos 2 escuelas para comparar.</p>
          ) : null}

          {!loading && items.length >= 2 ? (
            <table className="min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-slate-50 px-4 py-3 text-left text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Criterio
                  </th>
                  {items.map((item) => (
                    <th key={item.id} className="bg-slate-50 px-4 py-3 text-left text-sm font-extrabold text-slate-900">
                      {item.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <CompareRow label="Ubicación" values={items.map((item) => formatField(item.location))} />
                <CompareRow label="Mensualidad" values={items.map((item) => formatMonthlyPrice(item))} />
                <CompareRow
                  label="Rating"
                  values={items.map((item) =>
                    typeof item.rating === "number" ? item.rating.toFixed(1) : "—",
                  )}
                />
                <CompareRow label="Horario" values={items.map((item) => formatField(item.schedule))} />
                <CompareRow label="Idiomas" values={items.map((item) => formatField(item.languages))} />
                <CompareRow
                  label="Alumnos por salón"
                  values={items.map((item) => formatField(item.studentsPerClass))}
                />
                <CompareRow
                  label="Inscripciones"
                  values={items.map((item) =>
                    item.enrollmentOpen
                      ? `Abiertas${item.enrollmentYear ? ` ${item.enrollmentYear}` : ""}`
                      : "Cerradas",
                  )}
                />
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CompareRow({ label, values }: { label: string; values: string[] }) {
  return (
    <tr>
      <td className="sticky left-0 z-10 border-t border-slate-100 bg-white px-4 py-3 text-xs font-bold text-slate-500">
        {label}
      </td>
      {values.map((value, index) => (
        <td key={`${label}-${index}`} className="border-t border-slate-100 px-4 py-3 text-sm text-slate-700">
          {value}
        </td>
      ))}
    </tr>
  );
}
