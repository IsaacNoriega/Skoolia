"use client";

import { History, MessageCircle, ChevronRight, Clock, MapPin, Calendar, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

import HistoryEmptyState from "./HistoryEmptyState";
import {
  messagesService,
  type ParentThread,
} from "@/lib/services/services/messages.service";

type GroupedHistory = {
  label: string;
  items: ParentThread[];
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

  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryTimeline() {
  const { user } = useAuth();
  const [items, setItems] = useState<ParentThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user?.id) return;
      try {
        const threads = await messagesService.listParentThreads(user.id);
        if (mounted) setItems(threads);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    const interval = setInterval(() => {
      void load();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user?.id]);

  const grouped = useMemo<GroupedHistory[]>(() => {
    const map = new Map<string, ParentThread[]>();

    for (const item of items) {
      const key = formatDayLabel(item.lastMessageAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }

    return Array.from(map.entries()).map(([label, groupItems]) => ({
      label,
      items: groupItems,
    }));
  }, [items]);

  if (!loading && items.length === 0) {
    return <HistoryEmptyState />;
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full rounded-[2.5rem] bg-white shadow-2xl shadow-indigo-100/40 border border-slate-50 overflow-hidden"
    >
      <div className="px-8 py-8 border-b border-slate-100 bg-gradient-to-r from-indigo-50/30 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <History size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-slate-900">Historial de Visitas</h3>
              <p className="text-sm font-medium text-slate-500">Escuelas que has contactado recientemente.</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 rounded-full bg-white px-4 py-2 border border-indigo-100 shadow-sm">
            <Sparkles size={14} className="text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Actualizado</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sincronizando historial...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {grouped.map((group, groupIdx) => (
              <div key={group.label} className="relative">
                {/* Timeline Line */}
                <div className="absolute left-6 top-10 bottom-0 w-0.5 bg-slate-100" />
                
                <div className="flex items-center gap-4 mb-8">
                  <div className="relative z-10 w-12 h-12 rounded-2xl bg-white border-2 border-indigo-600 flex items-center justify-center shadow-md shadow-indigo-50">
                    <Calendar size={20} className="text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{group.label}</h4>
                </div>

                <div className="ml-6 pl-10 space-y-6">
                  <AnimatePresence>
                    {group.items.map((item, idx) => {
                      const isMine = item.lastSenderRole === 'parent';
                      const initial = item.schoolName.trim().charAt(0).toUpperCase() || "E";
                      
                      return (
                        <motion.div
                          key={`${item.schoolId}-${idx}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Link
                            href={`/parents/messages/${item.schoolId}`}
                            className="group relative flex items-center justify-between rounded-[2rem] border-2 border-slate-50 bg-slate-50/30 p-6 transition-all hover:border-indigo-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-50/50"
                          >
                            <div className="flex items-center gap-6 min-w-0">
                              <div className="relative shrink-0">
                                <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-slate-100 to-slate-200 font-black text-2xl text-slate-400 group-hover:from-indigo-600 group-hover:to-violet-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                  {initial}
                                </div>
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                                  <MapPin size={12} className="text-slate-400" />
                                </div>
                              </div>

                              <div className="min-w-0">
                                <h5 className="truncate text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                  {item.schoolName}
                                </h5>
                                <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                                  {item.lastMessage}
                                </p>
                                <div className="mt-3 flex items-center gap-4">
                                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                    <Clock size={12} className="text-indigo-500" />
                                    {formatTimeLabel(item.lastMessageAt)}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-100">
                                    <MessageCircle size={12} className="text-indigo-500" />
                                    Conversación
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-100 transition-all duration-300">
                              <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
                            </div>
                          </Link>
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
  );
}
