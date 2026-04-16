"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock3,
  Languages,
  Users,
  ClipboardCheck,
  ChevronLeft,
  ChevronRight,
  Heart,
  BookOpen,
  Calendar,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const SchoolsMap = dynamic(() => import("@/components/onboarding/SchoolsMap"), { ssr: false });

import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { schoolRatingsService, type SchoolRating } from "@/lib/services/services/rating.service";
import { favoritesService } from "@/lib/services/services/favorites.service";

export default function InstitutionDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const schoolId = params?.id;

  const [school, setSchool] = useState<School | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ratings, setRatings] = useState<SchoolRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFav, setTogglingFav] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetching Data
  useEffect(() => {
    if (!schoolId) return;
    let mounted = true;

    (async () => {
      try {
        setLoading(true);
        const [schoolData, coursesData, ratingsData] = await Promise.all([
          schoolsService.getById(schoolId),
          coursesService.listBySchoolId(schoolId),
          schoolRatingsService.list({ schoolId, page: 1, pageSize: 20 }),
        ]);

        if (!mounted) return;
        setSchool(schoolData);
        setCourses(coursesData);
        setRatings(ratingsData);
      } catch (err) {
        if (!mounted) return;
        setError("No se pudo cargar la información.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [schoolId]);

  const galleryItems = useMemo(() => {
    if (!school) return [];
    const items = [];
    if (school.coverImageUrl) items.push({ label: "Portada", src: school.coverImageUrl, fit: "cover" });
    if (school.logoUrl) items.push({ label: "Logo", src: school.logoUrl, fit: "contain" });
    // Imagen por defecto para evitar error de Next/Image
    if (items.length === 0) items.push({ label: "Sin imagen", src: "/images/placeholder-school.jpg", fit: "cover" });
    return items;
  }, [school]);

  if (loading) return <div className="p-20 text-center animate-pulse">Cargando Skoolia...</div>;
  if (error || !school) return <div className="p-20 text-center text-red-500">{error || "No encontrado"}</div>;

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20">
      {/* HEADER / NAV */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-bold bg-white shadow-sm border border-neutral-100 px-4 py-2 rounded-full hover:bg-neutral-50 transition"
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <button 
          onClick={() => setIsFavorite(!isFavorite)}
          className={`p-2.5 rounded-full border transition ${isFavorite ? 'bg-rose-50 border-rose-100 text-rose-500' : 'bg-white border-neutral-100 text-neutral-400'}`}
        >
          <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 space-y-10">
        
        {/* TITULO Y HERO */}
        <header className="text-center space-y-4">
          <span className="text-[11px] font-black tracking-[0.3em] text-indigo-600 uppercase">Perfil de Institución</span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900">{school.name}</h1>
          <div className="flex justify-center gap-3">
             <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold">{school.educationalLevel}</span>
             <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">{school.institutionType}</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* COLUMNA IZQUIERDA: CONTENIDO */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* GALERIA MODERNA */}
            <section className="relative h-[500px] rounded-[40px] overflow-hidden shadow-2xl bg-neutral-200">
               <Image 
                  src={galleryItems[activeImageIndex].src} 
                  alt="School" 
                  fill 
                  className={`transition-all duration-700 ${galleryItems[activeImageIndex].fit === 'cover' ? 'object-cover' : 'object-contain p-12'}`}
               />
               <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
               
               {/* Controles galeria */}
               <div className="absolute bottom-6 left-6 flex gap-2">
                 {galleryItems.map((_, i) => (
                   <button 
                    key={i} 
                    onClick={() => setActiveImageIndex(i)}
                    className={`h-1.5 transition-all rounded-full ${i === activeImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
                   />
                 ))}
               </div>
            </section>

            {/* BENTO GRID DE INFO RÁPIDA */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Clock3 size={20}/>} label="Horario" value={school.schedule || "Por definir"} />
              <StatCard icon={<Languages size={20}/>} label="Idiomas" value={school.languages || "Por definir"} />
              <StatCard icon={<Users size={20}/>} label="Alumnos/Salón" value="Por definir" />
              <StatCard icon={<ClipboardCheck size={20}/>} label="Inscripciones" value={school.enrollmentOpen ? "Abiertas" : "Cerradas"} color="text-emerald-600" />
            </section>

            {/* FILOSOFÍA Y PROPUESTA */}
            <section className="bg-white p-10 rounded-[40px] border border-neutral-100 shadow-sm space-y-6">
              <h2 className="text-2xl font-bold">Nuestra Propuesta</h2>
              <p className="text-neutral-600 leading-relaxed text-lg">
                {school.description || "Esta institución se enfoca en brindar una experiencia educativa moderna..."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                {["Acompañamiento humano", "Excelencia académica", "Formación integral"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-neutral-700 font-medium">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" /> {item}
                  </div>
                ))}
              </div>
            </section>

            {/* MAPA */}
            <section className="space-y-4">
              <h3 className="text-xl font-bold px-2">Ubicación</h3>
              <div className="rounded-[40px] overflow-hidden shadow-lg border border-neutral-100 h-[350px]">
                {typeof school.latitude === 'number' && typeof school.longitude === 'number' ? (
                  <SchoolsMap
                    schools={[{
                      id: school.id,
                      name: school.name,
                      lat: school.latitude,
                      lng: school.longitude,
                      level: school.educationalLevel ?? undefined
                    }]}
                    height={350}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-neutral-400 text-sm">Ubicación no disponible</div>
                )}
              </div>
            </section>
          </div>

          {/* COLUMNA DERECHA: SIDEBAR STICKY */}
          <aside className="lg:col-span-4">
            <div className="sticky top-10 bg-white p-8 rounded-[40px] border border-neutral-100 shadow-xl space-y-8 text-center lg:text-left">
              <div>
                <span className="text-xs font-black text-neutral-400 uppercase tracking-widest">Inversión Estimada</span>
                <p className="text-4xl font-black text-slate-900 mt-1">Por definir</p>
              </div>

              <div className="space-y-4">
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-indigo-200">
                  Solicitar Información
                </button>
                <button className="w-full bg-white border border-neutral-200 text-neutral-700 font-bold py-4 rounded-2xl hover:bg-neutral-50 transition">
                  Agendar Visita
                </button>
              </div>

              <div className="pt-6 border-t border-neutral-50 space-y-4">
                <div className="flex items-start gap-3 text-sm text-neutral-500">
                  <MapPin size={18} className="mt-0.5 text-indigo-500 flex-shrink-0" />
                  <span>{school.address || "Dirección no disponible"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-500">
                  <Star size={18} className="text-amber-400" />
                  <span>{school.ratingsCount} Reseñas totales</span>
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </main>
    </div>
  );
}

// Subcomponente para las tarjetas de stats (Bento Grid)
function StatCard({ icon, label, value, color = "text-slate-900" }: { icon: ReactNode, label: string, value: string, color?: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-neutral-100 shadow-sm hover:scale-[1.02] transition">
      <div className="text-indigo-500 mb-3">{icon}</div>
      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{label}</p>
      <p className={`text-sm font-bold mt-1 truncate ${color}`}>{value}</p>
    </div>
  );
}