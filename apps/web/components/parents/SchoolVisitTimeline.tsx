"use client";

import { useEffect, useMemo, useState } from "react";
import { History, MapPin, ChevronRight } from "lucide-react";
import Image from "next/image";

import HistoryEmptyState from "./HistoryEmptyState";
import FavoriteDetailModal from "./FavoriteDetailModal";
import {
  getSchoolHistory,
  type SchoolVisit,
} from "@/lib/history/school-history";
import { schoolsService } from "@/lib/services/services/schools.service";
import { useAuth } from "@/contexts/AuthContext";

type ModalItem = {
  id: string;
  imageUrl?: string;
  badges?: string[];
  level?: string;
  title: string;
  location: string;
  price: string | number;
  description?: string;
  rating?: number;
  schedule?: string;
  languages?: string;
  studentsPerClass?: number | string;
  enrollmentOpen?: boolean;
  enrollmentYear?: number;
  monthlyPrice?: number;
};

type GroupedVisits = {
  label: string;
  items: SchoolVisit[];
};

function formatDayLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (current.getTime() === today.getTime()) return "Hoy";
  if (current.getTime() === yesterday.getTime()) return "Ayer";

  return date.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

export default function SchoolVisitTimeline() {
  const { user } = useAuth();
  const [items, setItems] = useState<SchoolVisit[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<ModalItem | undefined>();

  useEffect(() => {
    const history = getSchoolHistory(user?.id);
    Promise.resolve().then(() => {
      setItems(history);
      setLoaded(true);
    });
  }, [user?.id]);

  const openModal = (visit: SchoolVisit) => {
    const base: ModalItem = {
      id: visit.id,
      imageUrl: visit.imageSrc || undefined,
      badges: [],
      level: "ESCUELA",
      title: visit.name,
      location: visit.location,
      price: "Por definir",
    };
    setSelected(base);
    setModalOpen(true);

    // Enriquecer con datos completos del backend
    (async () => {
      try {
        const full = await schoolsService.getById(visit.id);
        setSelected((prev) =>
          prev && prev.id === visit.id
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
                price: full.monthlyPrice ?? prev.price,
                imageUrl: full.coverImageUrl || full.logoUrl || prev.imageUrl,
                location: full.city || full.address || prev.location,
              }
            : prev
        );
      } catch {
        // Silencioso: mantenemos datos básicos del historial
      }
    })();
  };

  const grouped = useMemo<GroupedVisits[]>(() => {
    const map = new Map<string, SchoolVisit[]>();
    for (const item of items) {
      const key = formatDayLabel(item.visitedAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return Array.from(map.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }, [items]);

  if (loaded && items.length === 0) {
    return <HistoryEmptyState />;
  }

  return (
    <>
    <section className="surface w-full rounded-4xl bg-white p-0 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100/70">
        <div className="flex items-center gap-2">
          <History size={18} className="text-slate-700" />
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">Historial</h3>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Escuelas que has visitado recientemente.
        </p>
      </div>

      {!loaded ? (
        <div className="px-5 sm:px-6 py-8 text-sm text-slate-500">Cargando historial...</div>
      ) : null}

      <div className="divide-y divide-slate-100/60">
        {grouped.map((group) => (
          <div key={group.label} className="px-5 sm:px-6 py-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
              {group.label}
            </p>

            <div className="mt-3 space-y-2">
              {group.items.map((item) => {
                const initial = item.name.trim().charAt(0).toUpperCase() || "E";

                return (
                  <button
                    key={`${item.id}-${item.visitedAt}`}
                    type="button"
                    onClick={() => openModal(item)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-100 px-3 py-3 text-left hover:bg-slate-50"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 font-extrabold text-slate-700">
                        {item.imageSrc ? (
                          <Image
                            src={item.imageSrc}
                            alt={item.name}
                            fill
                            sizes="36px"
                            className="object-cover"
                          />
                        ) : (
                          initial
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {item.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin size={11} />
                          {item.location}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          {formatTimeLabel(item.visitedAt)}
                        </p>
                      </div>
                    </div>

                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-700">
                      <ChevronRight size={16} />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>

    <FavoriteDetailModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      item={selected}
    />
  </>
  );
}
