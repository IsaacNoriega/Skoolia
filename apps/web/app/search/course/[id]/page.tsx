"use client";

import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { useAuth } from "@/contexts/AuthContext";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { enrollmentService, EnrollmentTargetType } from "@/lib/services/services/enrollment.service";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  ArrowUpRight,
  BookOpen, 
  Calendar, 
  Users, 
  ClipboardCheck, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MapPin,
  MessageCircle
} from "lucide-react";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { courseMessagesService } from "@/lib/services/services/course-messages.service";

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
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    coursesService
      .getById(id as string)
      .then((data) => {
        setCourse(data);
      })
      .catch(() => setError("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, [id]);

  const galleryItems = useMemo(() => {
    if (!course) return [];
    const items = [];
    if (course.coverImageUrl) {
      items.push({ label: "Principal", src: course.coverImageUrl });
    }
    
    // Galería real
    if (course.gallery && course.gallery.length > 0) {
      course.gallery.forEach((url, i) => {
        items.push({ label: `Galería ${i + 1}`, src: url });
      });
    } else {
      // Fallback premium seeds solo si no hay galería
      items.push({ label: "Ambiente", src: `https://picsum.photos/seed/${id}-course-1/1200/800` });
      items.push({ label: "Práctica", src: `https://picsum.photos/seed/${id}-course-2/1200/800` });
    }
    return items;
  }, [course, id]);

  useEffect(() => {
    if (!id || !user) return;
    favoritesService.isFavorite(id as string).then(res => setIsFavorite(res.isFavorite));
  }, [id, user]);

  const toggleFavorite = async () => {
    if (!user) {
      setActionMessage("Inicia sesión para guardar favoritos.");
      return;
    }
    if (!course?.id) return;
    try {
      const res = await coursesService.toggleFavorite(course.id);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      setActionMessage("Error al actualizar favorito.");
    }
  };

  const handleContact = async () => {
    if (!course || !user) {
      setActionMessage("Inicia sesión para contactar.");
      return;
    }
    setSending(true);
    setActionMessage(null);
    try {
      await trackLead({
        targetId: course.id,
        originType: "COURSE",
        trigger: "INFO_REQUEST",
        status: "INTERESADO",
      });
      await courseMessagesService.sendCourseMessage(course.id, "Hola, me interesa obtener más información sobre este curso.", { id: user.id, role: user.role });
      setActionMessage("¡Mensaje enviado con éxito!");
    } catch (err) {
      setActionMessage("Error al enviar el mensaje.");
    } finally {
      setSending(false);
    }
  };

  const handleEnroll = async () => {
    if (!user?.id || !course?.id) {
      setActionMessage("Inicia sesión para inscribirte.");
      return;
    }
    setSending(true);
    setActionMessage(null);
    try {
      await enrollmentService.enroll({
        targetId: course.id,
        targetType: EnrollmentTargetType.COURSE,
        amount: course.price || 2450, // Fallback if no price
      });
      
      setActionMessage("¡Inscripción realizada con éxito!");
      // Optional: Refresh or redirect
    } catch (e) {
      setActionMessage("Error al procesar la inscripción.");
    } finally {
      setSending(false);
    }
  };

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">Preparando curso...</p>
      </div>
    </div>
  );

  if (error || !course) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-2xl font-black text-slate-900">Oops, algo salió mal</h2>
        <p className="text-slate-500">{error || "No encontramos el curso que buscas."}</p>
        <button onClick={() => router.back()} className="font-bold text-violet-600 underline">Volver atrás</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen selection:bg-violet-50 selection:text-violet-900 overflow-x-hidden">
      {/* 🌑 MINIMAL NAV */}
      <nav className="fixed inset-x-0 top-0 z-[100] px-8 py-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:text-violet-600 hover:border-violet-100 transition-all active:scale-95 shadow-sm"
          >
            <ArrowLeft size={14} />
            <span className="uppercase tracking-widest">Regresar</span>
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={toggleFavorite}
            className={`px-5 py-2.5 rounded-full border transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 ${
              isFavorite 
              ? 'bg-violet-600 text-white border-violet-600' 
              : 'bg-white text-slate-400 border-slate-200 hover:text-violet-600 hover:border-violet-100 shadow-sm'
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            <span>{isFavorite ? 'Guardado' : 'Favorito'}</span>
          </motion.button>
        </div>
      </nav>

      <main className="pt-32 pb-32 max-w-6xl mx-auto px-8">
        
        {/* 🏛️ MINIMAL HERO */}
        <section className="mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
               <span className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.4em]">Curso</span>
               <div className="h-px w-8 bg-violet-100" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">{course.modality || "Presencial"}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
               {course.name}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={16} className="text-violet-400" />
                <p className="text-sm font-medium">
                  <span className="text-slate-900">{course.institutionName || "Institución Educativa"}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  <Star size={14} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">4.9</span>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* 🖼️ CONTENT ARCHITECTURE */}
          <div className="lg:col-span-7 space-y-24">
            
            {/* Gallery / Image: Pure Focus */}
            <section className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-sm">
               <AnimatePresence mode="wait">
                 <motion.div
                   key={activeImageIndex}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.5 }}
                   className="absolute inset-0"
                 >
                   <Image 
                      src={galleryItems[activeImageIndex]?.src || course.coverImageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"} 
                      alt={course.name} 
                      fill 
                      className="object-cover"
                      unoptimized
                   />
                 </motion.div>
               </AnimatePresence>

               {galleryItems.length > 1 && (
                 <div className="absolute inset-x-6 bottom-6 flex justify-between items-center">
                    <div className="flex gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-100 shadow-sm">
                      {galleryItems.map((_, i) => (
                        <button 
                          key={i} 
                          onClick={() => setActiveImageIndex(i)}
                          className={`h-1 transition-all duration-500 rounded-full ${i === activeImageIndex ? 'w-6 bg-violet-600' : 'w-1 bg-slate-200 hover:bg-violet-200'}`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1))}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-100 text-slate-900 hover:text-violet-600 transition-all active:scale-90 shadow-sm"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => setActiveImageIndex((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0))}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-100 text-slate-900 hover:text-violet-600 transition-all active:scale-90 shadow-sm"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                 </div>
               )}
            </section>

            {/* 🍱 MINIMAL GRID */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Calendar size={16}/>, label: "Inicio", value: course.startDate ? new Date(course.startDate).toLocaleDateString() : "Inmediato" },
                { icon: <BookOpen size={16}/>, label: "Duración", value: `${course.duration || "12"} Semanas` },
                { icon: <Users size={16}/>, label: "Cupo", value: course.maxStudents ? `${course.maxStudents}` : "15" },
                { icon: <ClipboardCheck size={16}/>, label: "Requisitos", value: "Entrevista" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3">
                  <div className="text-violet-500">{stat.icon}</div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* 📝 DESCRIPTION */}
            <section className="space-y-6">
              <h2 className="text-[10px] font-bold text-violet-600 uppercase tracking-[0.4em]">Sobre el programa</h2>
              <p className="text-xl leading-relaxed text-slate-600 font-normal">
                <span className="text-slate-900">{course.description || "Un programa diseñado para transformar tu carrera a través de proyectos reales y mentoría experta."}</span>
              </p>
            </section>

            {/* 🏛️ INSTITUTION CONTEXT */}
            <section className="p-8 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-6">
               <div className="flex items-center gap-5">
                  <div className="h-12 w-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                     <BookOpen size={20} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Impartido por</p>
                    <p className="text-lg font-bold text-slate-900">{course.institutionName || "Institución Educativa"}</p>
                  </div>
               </div>
               <button 
                onClick={() => router.push(`/search/institutions/${course.schoolId || ''}`)}
                className="text-[9px] font-bold text-violet-600 uppercase tracking-widest border-b border-violet-200 pb-0.5 hover:border-violet-600 transition-colors"
               >
                  Ver perfil de la escuela →
               </button>
            </section>

            {/* 💬 REVIEWS / FEEDBACK: MINIMAL */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em]">Experiencias</h2>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  <span className="text-[10px] font-bold text-slate-900">4.9 (12 opiniones)</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-8 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">
                    "El contenido del curso es muy completo y los profesores son expertos en el área. Altamente recomendado."
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-violet-50 flex items-center justify-center text-[8px] font-bold text-violet-400">
                      JS
                    </div>
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Juan Sánchez — Graduado 2025</p>
                  </div>
                </div>
                
                {user ? (
                  <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Próximamente: Podrás calificar este curso directamente</p>
                  </div>
                ) : (
                  <button 
                    onClick={() => router.push('/auth/login')}
                    className="w-full p-8 text-center border border-slate-100 rounded-2xl text-[9px] font-bold text-slate-400 uppercase tracking-widest hover:bg-slate-50 transition-all"
                  >
                    Inicia sesión para compartir tu experiencia
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* 📬 MINIMAL SIDEBAR */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Costo del curso</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">
                      {course.price ? `$${course.price.toLocaleString()}` : "$2,450"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">MXN</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleContact}
                    disabled={sending}
                    className="w-full h-14 bg-white text-slate-900 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={14} className="text-violet-500" />
                    Solicitar Información
                  </button>
                  <button
                    onClick={handleEnroll}
                    disabled={sending}
                    className="w-full h-14 bg-violet-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-50 shadow-md shadow-violet-100"
                  >
                    {sending ? "Procesando..." : "Reservar Mi Lugar"}
                  </button>
                  <button
                    className="w-full h-14 bg-white text-slate-900 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95"
                  >
                    Descargar Temario
                  </button>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar size={14} className="text-violet-400" />
                    <p className="text-[11px] font-medium text-slate-500">Próximo inicio: 15 de Septiembre</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ClipboardCheck size={14} className="text-emerald-500" />
                    <p className="text-[11px] font-medium text-slate-500">Certificación Oficial</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
          
        </div>
      </main>
      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[200] transform -translate-x-1/2 px-6 py-3 bg-slate-900 text-white text-[11px] font-bold uppercase tracking-widest rounded-full shadow-2xl flex items-center gap-4"
          >
            <span>{actionMessage}</span>
            <button 
              onClick={() => setActionMessage(null)}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}