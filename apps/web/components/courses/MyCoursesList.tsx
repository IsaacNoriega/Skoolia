"use client";
import { useEffect, useState } from "react";
import { coursesService, Course } from "@/lib/services/services/courses.service";
import { useRouter } from "next/navigation";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";

export default function MyCoursesList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { trackLead } = useLeadTracking({ userId: "" }); // Reemplaza por el userId real

  useEffect(() => {
coursesService.listMine().then((courses) => {
  setCourses(courses ?? []);
  setLoading(false);
});
  }, []);

  if (loading) return <div>Cargando cursos...</div>;
  if (!courses.length) return <div className="text-slate-500">No tienes cursos registrados.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
      {courses.map((course) => (
        <div
          key={course.id}
          className="surface rounded-2xl bg-white p-5 shadow hover:shadow-lg cursor-pointer transition"
          onClick={() => {
            trackLead({
              targetId: course.id,
              originType: "COURSE",
              trigger: "VIEW",
              status: "INTERESADO"
            });
            router.push(`/courses/${course.id}`);
          }}
        >
          <div className="font-bold text-lg mb-1">{course.name}</div>
          <div className="text-slate-500 text-sm mb-2 line-clamp-2">{course.description}</div>
          <div className="text-xs text-slate-400">{course.status === "draft" ? "Borrador" : course.status === "published" ? "Publicado" : "Archivado"}</div>
        </div>
      ))}
    </div>
  );
}
