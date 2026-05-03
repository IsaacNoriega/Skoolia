"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, MessageSquare, Clock, ArrowRight, Sparkles, GraduationCap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

import MessagesEmptyState from "./MessagesEmptyState";

import {
  messagesService,
  type ParentThread,
} from "@/lib/services/services/messages.service";

import {
  courseMessagesService,
  type CourseThread,
} from "@/lib/services/services/course-messages.service";

function formatDateLabel(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function MessagesList() {
  const { user } = useAuth();
  const [schoolThreads, setSchoolThreads] = useState<ParentThread[]>([]);
  const [courseThreads, setCourseThreads] = useState<CourseThread[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔁 reload (para polling)
  const loadThreads = useCallback(async () => {
    if (!user) return;
    const [schools, courses] = await Promise.all([
      messagesService.listParentThreads(user.id),
      courseMessagesService.listCourseThreads(user.id),
    ]);
    setSchoolThreads(schools);
    setCourseThreads(courses);
  }, [user]);

  // 🚀 initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user) return;
        const [schools, courses] = await Promise.all([
          messagesService.listParentThreads(user.id),
          courseMessagesService.listCourseThreads(user.id),
        ]);
        if (mounted) {
          setSchoolThreads(schools);
          setCourseThreads(courses);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  // ⏱ polling inteligente
  useEffect(() => {
    if (loading) return;

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadThreads();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [loadThreads, loading]);

  // 🎨 UI helpers
  const renderedSchools = useMemo(() => {
    return schoolThreads
      .filter((it) => !!it.schoolId)
      .map((it) => ({
        ...it,
        initial: (it.schoolName ?? "").trim().charAt(0).toUpperCase() || "S",
      }));
  }, [schoolThreads]);

  const renderedCourses = useMemo(() => {
    return courseThreads
      .filter((it) => !!it.courseId)
      .map((it) => ({
        ...it,
        initial: (it.courseName ?? "").trim().charAt(0).toUpperCase() || "C",
      }));
  }, [courseThreads]);

  // 📭 empty state
  if (!loading && !renderedSchools.length && !renderedCourses.length) {
    return <MessagesEmptyState />;
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full space-y-8"
    >
      <div className="rounded-[2.5rem] bg-white p-10 shadow-2xl shadow-indigo-100/40 border border-slate-50">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-200">
              <MessageSquare size={32} className="text-white" />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-3xl font-black tracking-tight text-slate-900">Mis Consultas</h3>
              <p className="text-slate-500 font-medium mt-1">Gestión centralizada de tus conversaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-indigo-50 px-5 py-2.5 border border-indigo-100">
            <Sparkles size={16} className="text-indigo-600" />
            <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Canal Seguro</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando hilos...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* ------------------ ESCUELAS ------------------ */}
          {renderedSchools.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px flex-1 bg-slate-100" />
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                  <GraduationCap size={14} className="text-indigo-500" />
                  Instituciones Escolares
                </h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {renderedSchools.map((it, idx) => (
                    <motion.div
                      key={`school-${it.schoolId}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link
                        href={`/parents/messages/${it.schoolId}`}
                        className="group relative flex flex-col sm:flex-row items-center justify-between rounded-[2rem] border-2 border-slate-50 bg-white p-6 transition-all hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-100/50"
                      >
                        <div className="flex items-center gap-6 min-w-0 w-full">
                          <div className="relative shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-slate-50 font-black text-2xl text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                              {it.initial}
                            </div>
                            {it.threadHasUnread && (
                              <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 font-black text-[10px] text-white border-4 border-white shadow-lg animate-bounce">
                                {it.unreadCount}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <h5 className="truncate text-lg font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {it.schoolName}
                              </h5>
                              {it.threadHasUnread ? (
                                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-indigo-600 border border-indigo-100">
                                  Nuevo Mensaje
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                                  Conversación Activa
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm font-medium text-slate-500 line-clamp-1 italic">
                              "{it.lastMessage}"
                            </p>

                            <div className="mt-4 flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                <Clock size={12} className="text-indigo-500" />
                                {formatDateLabel(it.lastMessageAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 group-hover:shadow-lg group-hover:shadow-indigo-100 transition-all duration-300">
                          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* ------------------ CURSOS ------------------ */}
          {renderedCourses.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 px-2">
                <div className="h-px flex-1 bg-slate-100" />
                <h4 className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-2">
                  <GraduationCap size={14} className="text-violet-500" />
                  Cursos Especializados
                </h4>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <AnimatePresence>
                  {renderedCourses.map((it, idx) => (
                    <motion.div
                      key={`course-${it.courseId}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Link
                        href={`/parents/messages/courses/${it.courseId}`}
                        className="group relative flex flex-col sm:flex-row items-center justify-between rounded-[2rem] border-2 border-slate-50 bg-white p-6 transition-all hover:border-violet-100 hover:shadow-2xl hover:shadow-violet-100/50"
                      >
                        <div className="flex items-center gap-6 min-w-0 w-full">
                          <div className="relative shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center rounded-[1.2rem] bg-slate-50 font-black text-2xl text-slate-300 group-hover:bg-violet-600 group-hover:text-white transition-all duration-500 shadow-sm">
                              {it.initial}
                            </div>
                            {it.threadHasUnread && (
                              <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 font-black text-[10px] text-white border-4 border-white shadow-lg animate-bounce">
                                {it.unreadCount}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-3">
                              <h5 className="truncate text-lg font-black text-slate-900 group-hover:text-violet-600 transition-colors">
                                {it.courseName}
                              </h5>
                              {it.threadHasUnread ? (
                                <span className="rounded-full bg-violet-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-violet-600 border border-violet-100">
                                  Nuevo Mensaje
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100">
                                  Conversación Activa
                                </span>
                              )}
                            </div>

                            <p className="mt-2 text-sm font-medium text-slate-500 line-clamp-1 italic">
                              "{it.lastMessage}"
                            </p>

                            <div className="mt-4 flex items-center gap-4">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                                <Clock size={12} className="text-violet-500" />
                                {formatDateLabel(it.lastMessageAt)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 sm:mt-0 shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 group-hover:shadow-lg group-hover:shadow-violet-100 transition-all duration-300">
                          <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}