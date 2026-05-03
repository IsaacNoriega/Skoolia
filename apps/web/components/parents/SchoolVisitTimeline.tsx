"use client";

import { useEffect, useMemo, useState } from "react";
import { History, MapPin, ChevronRight, Clock, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-4xl bg-white shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
    >
      <div className="px-8 py-10 border-b border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-lg flex items-center justify-center">
            <History size={28} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="text-2xl font-black tracking-tight text-slate-900">Historial</h3>
            <p className="text-sm font-medium text-slate-500">Escuelas que has visitado recientemente.</p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Cargando...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((group) => (
              <div key={group.label} className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-100" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative z-10 w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
                    <Calendar size={18} className="text-white" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</h4>
                </div>

                <div className="ml-5 pl-8 space-y-4">
                  <AnimatePresence>
                    {group.items.map((item, idx) => {
                      const initial = item.name.trim().charAt(0).toUpperCase() || "E";
                      
                      return (
                        <motion.div
                          key={`${item.id}-${item.visitedAt}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            className="group relative flex w-full items-center justify-between rounded-3xl border border-slate-100 bg-white p-5 text-left transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50"
                          >
                            <div className="flex items-center gap-5 min-w-0">
                              <div className="relative shrink-0">
                                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-slate-50 font-black text-xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-300 transition-colors shadow-sm">
                                  {item.imageSrc ? (
                                    <Image
                                      src={item.imageSrc}
                                      alt={item.name}
                                      fill
                                      sizes="56px"
                                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    initial
                                  )}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <h5 className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {item.name}
                                </h5>
                                <div className="mt-1.5 flex flex-wrap items-center gap-3">
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                    <MapPin size={12} className="text-slate-300" />
                                    {item.location}
                                  </div>
                                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                                    <Clock size={12} className="text-slate-300" />
                                    {formatTimeLabel(item.visitedAt)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                              <ChevronRight size={18} />
                            </div>
                          </button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>

    <FavoriteDetailModal
      open={modalOpen}
      onClose={() => setModalOpen(false)}
      item={selected}
    />
  </>
  );
}
