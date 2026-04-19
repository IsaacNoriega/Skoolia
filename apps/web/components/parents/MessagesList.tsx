"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ChevronRight, Link as LinkIcon } from "lucide-react";
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
    <section className="surface w-full rounded-4xl bg-white p-0 overflow-hidden">
      <div className="px-5 sm:px-6 py-4 sm:py-5">
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Mis Consultas
        </h3>
        <p className="mt-1 text-xs sm:text-sm text-slate-600">
          Seguimiento de tus dudas con instituciones.
        </p>
      </div>

      {loading && (
        <div className="px-5 sm:px-6 py-8 text-sm text-slate-500">
          Cargando mensajes...
        </div>
      )}

      {/* ------------------ ESCUELAS ------------------ */}
      {renderedSchools.length > 0 && (
        <>
          <div className="px-5 sm:px-6 pt-2 pb-1">
            <h4 className="text-base sm:text-lg font-bold text-violet-700">
              Escuelas
            </h4>
          </div>

          <div className="divide-y divide-slate-100/60">
            {renderedSchools.map((it) => (
              <Link
                key={`school-${it.schoolId}`}
                href={`/parents/messages/${it.schoolId}`}
                className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-700">
                    {it.initial}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="text-sm sm:text-base font-extrabold text-slate-900">
                        {it.schoolName}
                      </p>

                      {it.threadHasUnread && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {it.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <LinkIcon size={12} />
                      {it.threadHasUnread
                        ? "NUEVO MENSAJE"
                        : "CONVERSACIÓN ACTIVA"}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {it.lastMessage}
                    </p>

                    <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-400">
                      {formatDateLabel(it.lastMessageAt)}
                    </p>
                  </div>
                </div>

                <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* ------------------ CURSOS ------------------ */}
      {renderedCourses.length > 0 && (
        <>
          <div className="px-5 sm:px-6 pt-6 pb-1">
            <h4 className="text-base sm:text-lg font-bold text-violet-700">
              Cursos
            </h4>
          </div>

          <div className="divide-y divide-slate-100/60">
            {renderedCourses.map((it) => (
              <Link
                key={`course-${it.courseId}`}
                href={`/parents/messages/courses/${it.courseId}`}
                className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 hover:bg-slate-50"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-slate-100 font-extrabold text-slate-700">
                    {it.initial}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <p className="text-sm sm:text-base font-extrabold text-slate-900">
                        {it.courseName}
                      </p>

                      {it.threadHasUnread && (
                        <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {it.unreadCount}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                      <LinkIcon size={12} />
                      {it.threadHasUnread
                        ? "NUEVO MENSAJE"
                        : "CONVERSACIÓN ACTIVA"}
                    </p>

                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {it.lastMessage}
                    </p>

                    <p className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-400">
                      {formatDateLabel(it.lastMessageAt)}
                    </p>
                  </div>
                </div>

                <span className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-slate-50 flex items-center justify-center">
                  <ChevronRight size={16} />
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}