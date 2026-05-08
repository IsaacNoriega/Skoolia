"use client";

import { useEffect, useMemo, useState } from "react";
import { History, MapPin, ChevronRight, Clock, Calendar, Sparkles, Building2, GraduationCap, Search, Filter } from "lucide-react";
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
    // Sort items by date descending
    const sorted = [...items].sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
    
    for (const item of sorted) {
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
      className="w-full rounded-[2.5rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden mb-20"
    >
      {/* 🏙️ MODERN HEADER */}
      <div className="relative px-8 py-12 border-b border-slate-50 bg-[radial-gradient(circle_at_top_right,_rgba(79,70,229,0.05),_transparent_40%)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 shadow-xl shadow-indigo-100 flex items-center justify-center text-white">
              <History size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight text-slate-900">Historial de Visitas</h3>
              <p className="text-slate-500 font-medium mt-1">Explora las instituciones que has consultado recientemente.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Buscar en historial..." 
                  className="h-12 pl-11 pr-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-bold text-slate-900 placeholder:text-slate-300 w-full md:w-64"
                />
             </div>
             <button className="h-12 w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-white hover:border-indigo-100 transition-all shadow-sm">
                <Filter size={18} />
             </button>
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-12">
        {!loaded ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-[3px] border-indigo-50" />
              <div className="absolute inset-0 h-16 w-16 rounded-full border-[3px] border-indigo-600 border-t-transparent animate-spin" />
            </div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sincronizando historial...</p>
          </div>
        ) : (
          <div className="space-y-16">
            {grouped.map((group, groupIdx) => (
              <div key={group.label} className="relative">
                {/* 🧵 TIMELINE LINE */}
                <div className="absolute left-[1.125rem] top-12 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-slate-100 to-transparent" />
                
                <div className="flex items-center gap-6 mb-10">
                  <div className="relative z-10 w-9 h-9 rounded-[0.75rem] bg-slate-950 flex items-center justify-center shadow-lg shadow-slate-200 ring-4 ring-white">
                    <Calendar size={16} className="text-white" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-600 mb-0.5">{groupIdx === 0 ? "Actividad Reciente" : "Anteriormente"}</h4>
                    <span className="text-sm font-black text-slate-900">{group.label}</span>
                  </div>
                </div>

                <div className="ml-10 space-y-6">
                  <AnimatePresence>
                    {group.items.map((item, idx) => {
                      const initial = item.name.trim().charAt(0).toUpperCase() || "E";
                      const isCourse = item.location.toLowerCase().includes("curso") || item.name.toLowerCase().includes("curso");
                      
                      return (
                        <motion.div
                          key={`${item.id}-${item.visitedAt}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 + groupIdx * 0.1 }}
                        >
                          <button
                            type="button"
                            onClick={() => openModal(item)}
                            className="group relative flex w-full flex-col sm:flex-row sm:items-center justify-between rounded-[2rem] border border-slate-100 bg-white p-6 text-left transition-all hover:border-indigo-200 hover:shadow-[0_20px_40px_rgba(79,70,229,0.06)] hover:translate-x-1"
                          >
                            <div className="flex items-center gap-6 min-w-0">
                              {/* 🖼️ IMAGE CONTAINER */}
                              <div className="relative shrink-0">
                                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-[1.25rem] bg-slate-50 font-black text-2xl text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-400 transition-all duration-500 shadow-inner">
                                  {item.imageSrc ? (
                                    <Image
                                      src={item.imageSrc}
                                      alt={item.name}
                                      fill
                                      sizes="64px"
                                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                  ) : (
                                    initial
                                  )}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white shadow-md flex items-center justify-center text-indigo-600 border border-slate-50">
                                  {isCourse ? <GraduationCap size={12} /> : <Building2 size={12} />}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${isCourse ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                      {isCourse ? "Curso" : "Escuela"}
                                   </span>
                                   <div className="flex items-center gap-1 text-[10px] font-bold text-slate-300">
                                      <Clock size={10} />
                                      {formatTimeLabel(item.visitedAt)}
                                   </div>
                                </div>
                                <h5 className="truncate text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">
                                  {item.name}
                                </h5>
                                <div className="mt-2 flex items-center gap-1 text-xs font-bold text-slate-400">
                                  <MapPin size={12} className="text-slate-300" />
                                  <span className="truncate">{item.location}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 sm:mt-0 shrink-0 flex items-center gap-4">
                              <div className="hidden sm:flex flex-col items-end">
                                 <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Interés</span>
                                 <div className="flex gap-0.5">
                                    {[1,2,3,4,5].map(s => (
                                      <div key={s} className={`w-3 h-1 rounded-full ${s <= 3 ? 'bg-indigo-400' : 'bg-slate-100'}`} />
                                    ))}
                                 </div>
                              </div>
                              <div className="h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:rotate-45 transition-all duration-500 shadow-sm flex">
                                <ChevronRight size={20} />
                              </div>
                            </div>
                            
                            {/* ✨ GLOW EFFECT ON HOVER */}
                            <div className="absolute inset-0 rounded-[2rem] bg-indigo-500/0 group-hover:bg-indigo-500/[0.02] transition-colors pointer-events-none" />
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

      {/* 🪄 BOTTOM INFO */}
      <div className="bg-slate-50/50 p-8 border-t border-slate-50 flex items-center justify-center gap-3">
         <Sparkles size={16} className="text-amber-400" />
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tu historial se sincroniza automáticamente entre dispositivos</p>
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
