"use client";

import Image from "next/image";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
  ShieldCheck,
} from "lucide-react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const SchoolsMap = dynamic(() => import("@/components/onboarding/SchoolsMap"), { ssr: false });

import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { schoolRatingsService, type SchoolRating } from "@/lib/services/services/rating.service";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { enrollmentService, EnrollmentTargetType } from "@/lib/services/services/enrollment.service";
import { useAuth } from "@/contexts/AuthContext";
import { useLeadTracking } from "@/lib/hooks/useLeadTracking";
import { messagesService } from "@/lib/services/services/messages.service";

export default function InstitutionDetailsPage() {
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  
  async function handleInteraction(content: string, trigger: string) {
    if (!school) {
      setActionMessage("No se encontró información de la escuela.");
      return;
    }
    if (!user) {
      setActionMessage("Debes iniciar sesión para realizar esta acción.");
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      await trackLead({
        targetId: school.id,
        originType: "SCHOOL",
        trigger,
        status: "INTERESADO",
      });
      await messagesService.sendParentMessage(school.id, content, user.id);
      setActionMessage("¡Solicitud enviada con éxito!");
    } catch (err) {
      setActionMessage("Ocurrió un error. Revisa tu conexión.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleEnroll() {
    if (!school) {
      setActionMessage("No se encontró información de la escuela.");
      return;
    }
    if (!user) {
      setActionMessage("Debes iniciar sesión para inscribirte.");
      return;
    }
    setActionLoading(true);
    setActionMessage(null);
    try {
      await enrollmentService.enroll({
        targetId: school.id,
        targetType: EnrollmentTargetType.SCHOOL,
        amount: school.monthlyPrice || 8500, // Fallback
      });
      setActionMessage("¡Inscripción realizada con éxito!");
    } catch (err) {
      setActionMessage("Error al procesar la inscripción.");
    } finally {
      setActionLoading(false);
    }
  }

  const params = useParams<{ id: string }>();
  const router = useRouter();
  const schoolId = params?.id;

  const [school, setSchool] = useState<School | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [ratings, setRatings] = useState<SchoolRating[]>([]);
  const [myRating, setMyRating] = useState<SchoolRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Form State
  const [submittingRating, setSubmittingRating] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState("");

  useEffect(() => {
    if (!schoolId || !user) return;
    favoritesService.isFavorite(schoolId).then(res => setIsFavorite(res.isFavorite));
  }, [schoolId, user]);

  async function toggleFavorite() {
    if (!user) {
      setActionMessage("Inicia sesión para guardar favoritos.");
      return;
    }
    try {
      const res = await favoritesService.toggle(schoolId!);
      setIsFavorite(res.isFavorite);
    } catch (err) {
      setActionMessage("Error al actualizar favorito.");
    }
  }

  useEffect(() => {
    if (!schoolId) return;
    let mounted = true;

    (async () => {
      try {
        const [schoolData, coursesData, ratingsData, myRatingData] = await Promise.all([
          schoolsService.getById(schoolId),
          coursesService.listBySchoolId(schoolId),
          schoolRatingsService.list({ schoolId, page: 1, pageSize: 20 }),
          user ? schoolRatingsService.getMine(schoolId) : Promise.resolve(null),
        ]);

        if (!mounted) return;
        setSchool(schoolData);
        setCourses(coursesData);
        setRatings(ratingsData);
        setMyRating(myRatingData);
        if (myRatingData) {
          setUserRating(myRatingData.rating);
          setUserComment(myRatingData.comment || "");
        }
      } catch (err) {
        if (mounted) setError("No se pudo cargar la información.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [schoolId, user]);

  async function handleReviewSubmit() {
    if (!user) {
      setActionMessage("Debes iniciar sesión para calificar.");
      return;
    }
    if (userRating === 0) {
      setActionMessage("Por favor selecciona una calificación.");
      return;
    }
    
    setSubmittingRating(true);
    try {
      const updated = await schoolRatingsService.upsert({
        schoolId: schoolId!,
        rating: userRating,
        comment: userComment,
      });
      setMyRating(updated);
      
      // Refresh global list
      const freshRatings = await schoolRatingsService.list({ schoolId: schoolId!, page: 1, pageSize: 20 });
      setRatings(freshRatings);
      setActionMessage("¡Gracias por tu opinión!");
    } catch (err) {
      setActionMessage("Error al enviar calificación.");
    } finally {
      setSubmittingRating(false);
    }
  }

  const galleryItems = useMemo(() => {
    if (!school) return [];
    const items = [];
    
    // Imagen principal
    if (school.coverImageUrl) {
      items.push({ label: "Principal", src: school.coverImageUrl, fit: "cover" });
    }

    // Galería real de la base de datos
    if (school.gallery && school.gallery.length > 0) {
      school.gallery.forEach((url, i) => {
        items.push({ label: `Galería ${i + 1}`, src: url, fit: "cover" });
      });
    } else {
      // Fallback premium seeds solo si no hay galería
      if (school.logoUrl) items.push({ label: "Logo", src: school.logoUrl, fit: "cover" });
      items.push({ label: "Ambiente", src: `https://picsum.photos/seed/${schoolId}-1/1200/800`, fit: "cover" });
      items.push({ label: "Educación", src: `https://picsum.photos/seed/${schoolId}-2/1200/800`, fit: "cover" });
    }
    
    return items;
  }, [school, schoolId]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
        <p className="text-sm font-bold tracking-widest text-slate-400 uppercase">Cargando experiencia...</p>
      </div>
    </div>
  );

  if (error || !school) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6 text-center">
      <div className="max-w-md space-y-6">
        <h2 className="text-2xl font-black text-slate-900">Oops, algo salió mal</h2>
        <p className="text-slate-500">{error || "No encontramos la institución que buscas."}</p>
        <button onClick={() => router.back()} className="font-bold text-indigo-600 underline">Volver atrás</button>
      </div>
    </div>
  );

  return (
    <div className="bg-white min-h-screen selection:bg-indigo-50 selection:text-indigo-900 overflow-x-hidden">
      {/* 🌑 MINIMAL NAV */}
      <nav className="fixed inset-x-0 top-0 z-[100] px-8 py-8 pointer-events-none">
        <div className="max-w-7xl mx-auto flex justify-between items-center pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-sm"
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
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600 hover:border-indigo-100 shadow-sm'
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
               <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.4em]">Institución</span>
               <div className="h-px w-8 bg-indigo-100" />
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">{school.institutionType || "Privada"}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
               {school.name}
            </h1>

            <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
              <div className="flex items-center gap-3 text-slate-400">
                <MapPin size={16} className="text-indigo-400" />
                <p className="text-sm font-medium">
                  <span className="text-slate-900">{school.city || "Ciudad de México"}</span>
                  <span className="mx-2 opacity-20">/</span>
                  <span className="uppercase tracking-widest text-[9px] font-bold">{school.address || "Distrito Educativo"}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex text-amber-400">
                  <Star size={14} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">{school.averageRating?.toFixed(1) || "5.0"}</span>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* 🖼️ CONTENT ARCHITECTURE */}
          <div className="lg:col-span-7 space-y-24">
            
            {/* Gallery: Pure Focus */}
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
                      src={galleryItems[activeImageIndex].src} 
                      alt="Gallery" 
                      fill 
                      className="object-cover"
                      priority={true}
                      unoptimized
                   />
                 </motion.div>
               </AnimatePresence>
               
               <div className="absolute inset-x-6 bottom-6 flex justify-between items-center">
                  <div className="flex gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-md rounded-full border border-slate-100 shadow-sm">
                    {galleryItems.map((_, i) => (
                      <button 
                        key={i} 
                        onClick={() => setActiveImageIndex(i)}
                        className={`h-1 transition-all duration-500 rounded-full ${i === activeImageIndex ? 'w-6 bg-indigo-600' : 'w-1 bg-slate-200 hover:bg-indigo-200'}`}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1))}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-100 text-slate-900 hover:text-indigo-600 transition-all active:scale-90 shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button 
                      onClick={() => setActiveImageIndex((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0))}
                      className="h-10 w-10 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-slate-100 text-slate-900 hover:text-indigo-600 transition-all active:scale-90 shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
               </div>
            </section>

            {/* 🍱 MINIMAL GRID */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: <Clock3 size={16}/>, label: "Horario", value: school.schedule || "08:00 - 15:00" },
                { icon: <Languages size={16}/>, label: "Idiomas", value: school.languages || "Bilingüe" },
                { icon: <Users size={16}/>, label: "Alumnos", value: school.maxStudentsPerClass ? `${school.maxStudentsPerClass}` : "25" },
                { icon: <ClipboardCheck size={16}/>, label: "Admisión", value: school.enrollmentOpen ? "Abierta" : "Cerrada" },
              ].map((stat, i) => (
                <div key={i} className="p-6 rounded-xl bg-slate-50/50 border border-slate-100 flex flex-col gap-3">
                  <div className="text-indigo-500">{stat.icon}</div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{stat.label}</p>
                    <p className="text-xs font-bold text-slate-900 tracking-tight">{stat.value}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* 📝 DESCRIPTION */}
            <section className="space-y-6">
              <h2 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.4em]">Descripción</h2>
              <p className="text-xl leading-relaxed text-slate-600 font-normal">
                <span className="text-slate-900">{school.description || "Un entorno diseñado para cultivar líderes, pensadores críticos y ciudadanos globales del mañana."}</span>
              </p>
              
              <div className="flex flex-wrap gap-2">
                {["Excelencia", "Innovación", "Valores"].map(tag => (
                  <span key={tag} className="px-4 py-1.5 bg-indigo-50/50 border border-indigo-100 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-widest">
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* 🗺️ MAP: CLEAN */}
            <section className="space-y-6">
              <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em]">Ubicación</h2>
              <div className="relative h-[400px] rounded-2xl overflow-hidden border border-slate-100">
                <SchoolsMap 
                  schools={[{ 
                    id: school.id, 
                    name: school.name, 
                    lat: school.latitude || 19.4326, 
                    lng: school.longitude || -99.1332, 
                    level: school.educationalLevel || "Escuela" 
                  }]} 
                />
              </div>
            </section>

            {/* 💬 REVIEWS: MINIMAL */}
            <section className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-[10px] font-bold text-slate-900 uppercase tracking-[0.4em]">Opiniones</h2>
                {!user && (
                  <button 
                    onClick={() => router.push('/auth/login')}
                    className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-0.5"
                  >
                    Inicia sesión para opinar
                  </button>
                )}
              </div>

              {/* Review Form */}
              {user && !myRating && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-6"
                >
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">¿Qué te parece esta institución?</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button 
                          key={s} 
                          onClick={() => setUserRating(s)}
                          className={`transition-all ${s <= (userRating || 0) ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}`}
                        >
                          <Star size={24} fill={s <= (userRating || 0) ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {(userRating || 0) > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="space-y-2">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tu Comentario</p>
                        <textarea 
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Comparte tu experiencia con esta institución..."
                          className="w-full h-32 p-4 rounded-xl border border-slate-100 bg-white text-sm outline-none focus:border-indigo-100 transition-all placeholder:text-slate-200"
                        />
                      </div>

                      <button 
                        onClick={handleReviewSubmit}
                        disabled={submittingRating}
                        className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-100"
                      >
                        {submittingRating ? "Enviando..." : "Publicar Reseña"}
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              <div className="space-y-4">
                 {ratings.length === 0 ? (
                   <div className="p-12 text-center border border-slate-100 rounded-2xl text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                     Sin reseñas aún
                   </div>
                 ) : (
                   ratings.map((r) => (
                     <div key={r.id} className="p-8 bg-white rounded-2xl border border-slate-100 space-y-4 shadow-sm">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                           <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                             {r.publicUserId.substring(0, 1).toUpperCase()}
                           </div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                         </div>
                         <div className="flex gap-0.5 text-amber-400">
                           {[...Array(5)].map((_, i) => (
                             <Star key={i} size={8} fill={i < r.rating ? "currentColor" : "none"} />
                           ))}
                         </div>
                       </div>
                       <p className="text-base leading-relaxed text-slate-600 font-normal italic">
                         "{r.comment}"
                       </p>
                     </div>
                   ))
                 )}
              </div>
            </section>
          </div>

          {/* 📬 MINIMAL SIDEBAR */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32 space-y-6">
              <div className="bg-white p-10 rounded-2xl border border-slate-100 shadow-sm space-y-8">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Inversión Mensual</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 tracking-tight">
                      {school.monthlyPrice ? `$${school.monthlyPrice.toLocaleString()}` : "$8,500"}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">MXN</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    className="w-full h-14 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-indigo-700 active:scale-95 disabled:opacity-50 shadow-md shadow-indigo-100"
                    disabled={actionLoading}
                    onClick={() => handleInteraction("Solicitud de información", "INFO_REQUEST")}
                  >
                    Solicitar Información
                  </button>
                  <button
                    className="w-full h-14 bg-white text-slate-900 border border-slate-200 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-slate-50 transition-all active:scale-95 disabled:opacity-50"
                    disabled={actionLoading}
                    onClick={() => handleInteraction("Solicitud de cita", "SCHEDULE_VISIT")}
                  >
                    Agendar Visita
                  </button>
                  <button
                    className="w-full h-14 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all hover:bg-emerald-700 active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-100"
                    disabled={actionLoading}
                    onClick={handleEnroll}
                  >
                    {actionLoading ? "Procesando..." : "Inscribirme Ahora"}
                  </button>
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin size={14} className="text-indigo-400" />
                    <p className="text-[11px] font-medium text-slate-500">{school.address}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <p className="text-[11px] font-medium text-slate-500">Verificado por Skoolia</p>
                  </div>
                </div>
              </div>

              <div className="p-8 rounded-2xl bg-slate-50/50 border border-slate-100 space-y-3">
                 <h4 className="text-[9px] font-bold text-slate-900 uppercase tracking-widest">Nota Legal</h4>
                 <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                   Toda la información es proporcionada por la institución y verificada bajo estándares de calidad.
                 </p>
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