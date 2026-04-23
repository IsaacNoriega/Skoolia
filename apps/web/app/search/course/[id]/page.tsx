"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { useAuth } from "@/contexts/AuthContext";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { ArrowLeft, BookOpen, Calendar, Users, ClipboardCheck } from "lucide-react";

export default function CourseDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Sugerencia: Usar getById si el servicio lo permite
    coursesService
      .listAll()
      .then((courses) => {
        const found = courses.find((c) => c.id === id);
        if (!found) setError("Curso no encontrado");
        setCourse(found || null);
      })
      .catch(() => setError("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, [id]);

  const galleryItems = useMemo(() => {
    if (!course) return [];
    const items = [];
    if (course.coverImageUrl) {
      items.push({ label: "Portada", src: course.coverImageUrl, fit: "cover" as const });
    }
    if (items.length === 0) {
      items.push({ label: "Sin imagen", src: "/images/placeholder-course.jpg", fit: "cover" as const });
    }
    return items;
  }, [course]);

  if (loading) return <div className="p-20 text-center animate-pulse">Cargando curso...</div>;
  if (error || !course) return <div className="p-20 text-center text-red-500">{error || "No encontrado"}</div>;

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20">
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold bg-white shadow-sm border border-neutral-100 px-4 py-2 rounded-full hover:bg-neutral-50 transition"
        >
          <ArrowLeft size={18} /> Volver
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 space-y-10">
        <header className="text-center space-y-4">
          <span className="text-[11px] font-black tracking-[0.3em] text-indigo-600 uppercase">Detalle de Curso</span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900">{course.name}</h1>
          <div className="flex justify-center gap-3">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{course.modality || "No especificada"}</span>
             <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
               {typeof course.capacity === 'number' ? `${course.capacity} cupos` : "Capacidad no especificada"}
             </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-10">
            <section className="relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl bg-neutral-200">
               <Image 
                  src={galleryItems[activeImageIndex].src} 
                  alt="Course" 
                  fill 
                  className={`transition-all duration-700 ${galleryItems[activeImageIndex].fit === 'cover' ? 'object-cover' : 'object-contain p-12'}`}
               />
               <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<BookOpen size={20}/>} label="Descripción" value={course.description ? "Disponible" : "Sin descripción"} />
              <StatCard icon={<Calendar size={20}/>} label="Inicio" value={course.startDate || "Por definir"} />
              <StatCard icon={<Calendar size={20}/>} label="Fin" value={course.endDate || "Por definir"} />
              <StatCard icon={<ClipboardCheck size={20}/>} label="Estado" value={course.status === 'published' ? "Publicado" : "Borrador"} color="text-emerald-600" />
            </section>

            <section className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">Sobre este curso</h2>
              <p className="text-neutral-600 leading-relaxed text-lg">
                {course.description || "Este curso aún no tiene una descripción detallada."}
              </p>
            </section>
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-10 bg-white p-8 rounded-[40px] border border-neutral-100 shadow-xl space-y-8">
              <div>
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Inversión</span>
                <p className="text-4xl font-black text-slate-900 mt-1">${course.price} MXN</p>
              </div>

              <button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-200"
                onClick={async () => {
                  if (!user?.id || !course?.id) return;
                  setSending(true);
                  setLeadError(null);
                  try {
                    await trackLead({
                      targetId: course.id,
                      originType: "COURSE",
                      trigger: "INSCRIBIRME",
                      status: "INTERESADO",
                    });
                  } catch (e) {
                    setLeadError("No se pudo registrar el interés. Intenta de nuevo.");
                  } finally {
                    setSending(false);
                  }
                }}
                disabled={sending}
              >
                {sending ? "Enviando..." : "Inscribirme ahora"}
              </button>
              {leadError && <div className="text-red-500 text-sm mt-2">{leadError}</div>}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

// Subcomponente fuera de la función principal
function StatCard({ icon, label, value, color = "text-slate-900" }: { icon: ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm">
      <div className="text-indigo-500 mb-3">{icon}</div>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-bold mt-1 truncate ${color}`}>{value}</p>
    </div>
  );
}