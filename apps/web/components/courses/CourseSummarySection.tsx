"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Eye } from "lucide-react";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { FavoriteButton } from "@/components/leads/FavoriteButton";

// Servicios e Interfaces
import { coursesService, Course } from "@/lib/services/services/courses.service";
import { userService, UserProfile } from "@/lib/services/services/users.service";

export default function CoursesDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [coursesData, userData] = await Promise.all([
          coursesService.listMine(),
          userService.getMe(),
        ]);

        if (!mounted) return;

        setCourses(coursesData ?? []);
        setUser(userData);
      } catch (err) {
        if (!mounted) return;
        setError("No se pudo cargar el resumen de tus cursos.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Estados UI
  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Cargando...</div>;
  }

  if (error) {
    return <div className="p-6 text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <User size={20} />
          </div>
          <div>
            <span className="block text-xs font-bold text-slate-400">
              ADMINISTRADOR
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">
              {user?.name ?? "Mi perfil"}
            </h1>
          </div>
        </div>
        <p className="text-sm text-slate-600">
          {user?.email ||
            "Gestiona tus cursos y su estado desde este panel."}
        </p>
      </header>

      {/* Cursos */}
      <section className="rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">
            Últimos cursos
          </h2>
        </div>

        <div className="divide-y">
          {courses.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">
              No hay cursos registrados.
            </div>
          ) : (
            courses.slice(0, 5).map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-bold text-slate-900">
                    {course.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {course.description || "Sin descripción"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1 text-xs bg-slate-100 px-3 py-1 rounded-lg hover:bg-slate-200"
                    onClick={() => {
                      trackLead({
                        targetId: course.id,
                        originType: "COURSE",
                        trigger: "VIEW_MORE",
                        status: "INTERESADO",
                      });
                      router.push(`/courses/${course.id}`);
                    }}
                  >
                    <Eye size={14} /> Ver detalles
                  </button>
                  <FavoriteButton
                    userId={user?.id || ""}
                    targetId={course.id}
                    originType="COURSE"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}