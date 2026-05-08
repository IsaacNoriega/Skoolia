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
  BookOpen, 
  Calendar, 
  Users, 
  ClipboardCheck, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  MapPin,
  MessageCircle,
  ShieldCheck
} from "lucide-react";
import { favoritesService } from "@/lib/services/services/favorites.service";
import { courseMessagesService } from "@/lib/services/services/course-messages.service";
import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { schoolRatingsService, type SchoolRating } from "@/lib/services/services/rating.service";
import { courseRatingsService, type CourseRating } from "@/lib/services/services/course-ratings.service";
import dynamic from "next/dynamic";

const SchoolsMap = dynamic(() => import("@/components/onboarding/SchoolsMap"), { ssr: false });

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
  const [school, setSchool] = useState<School | null>(null);
  const [ratings, setRatings] = useState<CourseRating[]>([]);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [userComment, setUserComment] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);
  const [myRating, setMyRating] = useState<SchoolRating | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    coursesService
      .getById(id as string)
      .then((data: any) => {
        setCourse(data);
        const schoolId = data.schoolId;
        if (schoolId) {
          schoolsService.getById(data.schoolId).then(setSchool).catch(() => {});
        }
        
        // Cargar ratings del curso (independiente de si tiene escuela o no)
        courseRatingsService.list({ courseId: id as string, page: 1, pageSize: 20 }).then(setRatings).catch(() => {});
        
        if (user && schoolId) {
          schoolRatingsService.getMine(schoolId).then(setMyRating).catch(() => {});
        }
      })
      .catch(() => setError("Error al cargar el curso"))
      .finally(() => setLoading(false));
  }, [id, user]);

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
    favoritesService.isFavorite(id as string)
      .then(res => setIsFavorite(res.isFavorite))
      .catch(() => setIsFavorite(false));
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
  const handleReviewSubmit = async () => {
    if (!user || !id) return;
    
    if (userRating === 0) {
      setActionMessage("Por favor, selecciona una calificación.");
      return;
    }

    if (!userComment.trim()) {
      setActionMessage("Por favor, escribe un comentario.");
      return;
    }

    setSubmittingRating(true);
    try {
      await courseRatingsService.upsert({
        courseId: id as string,
        rating: userRating,
        comment: userComment,
      });
      // Actualizar lista local
      const freshRatings = await courseRatingsService.list({ courseId: id as string, page: 1, pageSize: 20 });
      setRatings(freshRatings);
      setActionMessage("¡Gracias por tu opinión!");
      setUserComment("");
      setUserRating(0);
    } catch (err) {
      setActionMessage("Error al enviar calificación.");
    } finally {
      setSubmittingRating(false);
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
        amount: course.price || 2450,
      });
      
      setActionMessage("¡Inscripción realizada con éxito!");
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
    <div className="bg-[#fdfcfd] min-h-screen selection:bg-violet-50 selection:text-violet-900 overflow-x-hidden">
      {/* 🌑 EXECUTIVE NAV */}
      <nav className="fixed inset-x-0 top-0 z-[100] px-6 py-6 pointer-events-none">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-[10px] font-black text-slate-500 hover:text-violet-600 hover:border-violet-100 transition-all active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
          >
            <ArrowLeft size={14} />
            <span className="uppercase tracking-[0.2em]">Regresar</span>
          </motion.button>
          
          <motion.button 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={toggleFavorite}
            className={`px-6 py-3 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${
              isFavorite 
              ? 'bg-violet-600 text-white border-violet-600' 
              : 'bg-white/80 backdrop-blur-xl text-slate-400 border-slate-200/50 hover:text-violet-600'
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            <span>{isFavorite ? 'Guardado' : 'Favorito'}</span>
          </motion.button>
        </div>
      </nav>

      {/* 🏙️ IMMERSIVE HERO */}
      <section className="relative h-[60vh] min-h-[500px] w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <Image 
              src={galleryItems[activeImageIndex]?.src || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"} 
              alt={course.name} 
              fill 
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-transparent to-[#fdfcfd]" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 px-8 pb-16 lg:pb-24">
          <div className="max-w-7xl mx-auto flex flex-col gap-12">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-[0.3em]">
                   {course.modality || "Presencial"}
                 </span>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                   <Star size={10} fill="currentColor" />
                   4.9 (Verificado)
                 </div>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] max-w-4xl">
                {course.name}
              </h1>
              <div 
                onClick={() => course.schoolId && router.push(`/search/institutions/${course.schoolId}`)}
                className="flex items-center gap-4 text-violet-600 font-black uppercase tracking-widest text-[11px] cursor-pointer hover:underline"
              >
                 <BookOpen size={16} />
                 Impartido por {course.schoolName || "Institución Aliada"}
              </div>
            </motion.div>

            {/* Gallery Mini-Nav - LEFT ALIGNED */}
            <div className="flex gap-4 p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] self-start">
               {galleryItems.slice(0, 4).map((img, i) => (
                 <button 
                   key={i}
                   onClick={() => setActiveImageIndex(i)}
                   className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 transition-all ${activeImageIndex === i ? 'border-white scale-110 shadow-xl' : 'border-transparent opacity-50 hover:opacity-100'}`}
                 >
                   <Image src={img.src} alt="Thumb" fill className="object-cover" unoptimized />
                 </button>
               ))}
            </div>
          </div>
        </div>
      </section>

      <main className="relative z-10 max-w-7xl mx-auto px-8 -mt-6 lg:-mt-10 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          <div className="lg:col-span-7 space-y-20">
            
            {/* 📝 DESCRIPTION */}
            <section className="space-y-8 bg-white border border-slate-100 p-10 lg:p-14 rounded-[3rem] shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
              <h2 className="text-[10px] font-black text-violet-600 uppercase tracking-[0.4em]">Propuesta Educativa</h2>
              <p className="text-2xl lg:text-3xl leading-[1.4] text-slate-600 font-medium tracking-tight">
                <span className="text-slate-950">{course.description || "Un programa inmersivo diseñado para transformar tu visión profesional a través de proyectos reales y mentoría de alto nivel."}</span>
              </p>
            </section>

            {/* 🍱 BENTO STATS - MOVED OUTSIDE */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard icon={<Calendar />} label="Inicio" value={course.startDate ? new Date(course.startDate).toLocaleDateString() : "Inmediato"} color="violet" />
              <StatCard icon={<BookOpen />} label="Modalidad" value={course.modality || "Presencial"} color="violet" />
              <StatCard icon={<Users />} label="Cupo" value={`${course.capacity || 15} Alumnos`} color="violet" />
              <StatCard icon={<ClipboardCheck />} label="Nivel" value="Profesional" color="violet" />
            </section>
          </div>

          {/* 📬 CONVERSION SIDEBAR */}
          <aside className="lg:col-span-5">
            <div className="sticky top-32 space-y-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/70 backdrop-blur-3xl p-10 lg:p-14 rounded-[3.5rem] border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] space-y-10 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <div className="space-y-2 text-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Costo del Programa</span>
                  <div className="flex items-baseline justify-center gap-3">
                    <span className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">
                      {course.price ? `$${course.price.toLocaleString()}` : "$2,450"}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MXN / Total</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <ActionButton 
                    label="Solicitar Información" 
                    icon={<MessageCircle size={16} />} 
                    variant="violet" 
                    loading={sending} 
                    onClick={handleContact}
                  />
                  <ActionButton 
                    label="Reservar Mi Lugar" 
                    variant="emerald" 
                    loading={sending} 
                    onClick={handleEnroll}
                  />
                  <ActionButton 
                    label="Descargar Temario" 
                    variant="outline" 
                    onClick={() => {}}
                  />
                </div>

                <div className="pt-10 border-t border-slate-100/50 space-y-6">
                   <SidebarInfo icon={<Calendar className="text-violet-500" />} text="Próximo Inicio: 15 Sept 2026" />
                   <SidebarInfo icon={<ShieldCheck className="text-emerald-500" />} text="Certificación con Valor Curricular" />
                </div>
              </motion.div>
            </div>
          </aside>
        </div>

        {/* 🗺️ MAP - FULL WIDTH */}
        {school && (
          <section className="mt-20 space-y-10">
             <div className="flex items-center gap-4">
               <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Ubicación de impartición</h2>
               <div className="h-px flex-1 bg-slate-100" />
             </div>
             <div className="relative h-[600px] rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl">
              <SchoolsMap 
                height={600}
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
        )}

          {/* 💬 REVIEWS & RATING FORM */}
          <section className="mt-32 space-y-12">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Experiencias de Alumnos</h2>
              {!user && (
                <button 
                  onClick={() => router.push('/auth/login')} 
                  className="px-6 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                >
                  Iniciar Sesión para Opinar
                </button>
              )}
            </div>

            {/* 📝 RATING FORM */}
            {user && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="p-10 bg-indigo-50/50 border border-indigo-100/50 rounded-[3rem] space-y-8"
              >
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-indigo-900 tracking-tight">¿Qué te parece este curso?</h3>
                  <p className="text-sm font-medium text-indigo-900/40">Tu opinión ayuda a otros alumnos a elegir su próximo paso.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setUserRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                          (hoverRating || userRating) >= star 
                            ? 'bg-amber-400 text-white shadow-lg shadow-amber-100 scale-110' 
                            : 'bg-white text-slate-300 hover:text-amber-300'
                        }`}
                      >
                        <Star 
                          size={24} 
                          fill={(hoverRating || userRating) >= star ? "currentColor" : "none"} 
                        />
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex-1 w-full relative">
                    <textarea 
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Cuéntanos tu experiencia..."
                      className="w-full p-6 bg-white border border-indigo-100 rounded-[2rem] text-sm font-medium text-slate-900 focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none min-h-[120px] resize-none"
                    />
                    <button 
                      disabled={submittingRating}
                      onClick={handleReviewSubmit}
                      className="absolute bottom-4 right-4 h-12 px-8 bg-slate-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {submittingRating ? "Enviando..." : "Publicar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {ratings.map((r) => (
               <motion.div 
                 initial={{ opacity: 0 }}
                 whileInView={{ opacity: 1 }}
                 key={r.id} 
                 className="p-10 bg-white rounded-[2.5rem] border border-slate-100 space-y-6 shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600">
                        {r.publicUserId.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(r.createdAt).toLocaleDateString()}</p>
                        <div className="flex gap-0.5 text-amber-400 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={10} fill={i < r.rating ? "currentColor" : "none"} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xl leading-relaxed text-slate-600 font-medium italic">
                    "{r.comment}"
                  </p>
               </motion.div>
             ))}
             {ratings.length === 0 && (
               <div className="col-span-full p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem]">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Sin reseñas aún</p>
               </div>
             )}
          </div>
        </section>
      </main>

      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className="fixed bottom-10 left-1/2 z-[200] transform -translate-x-1/2 px-8 py-4 bg-slate-950 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-xl"
          >
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage(null)} className="opacity-50 hover:opacity-100 transition-opacity">
               <Trash2 size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: ReactNode, label: string, value: string, color: string }) {
  const bg = color === 'violet' ? 'bg-violet-50' : 'bg-slate-50';
  const text = color === 'violet' ? 'text-violet-600' : 'text-indigo-600';
  return (
    <div className={`p-8 rounded-[2.5rem] ${bg} border border-slate-100 flex flex-col gap-4 transition-all hover:scale-105 hover:shadow-lg`}>
      <div className={text}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-slate-950 tracking-tight leading-tight">{value}</p>
      </div>
    </div>
  );
}

function ActionButton({ label, icon, variant, onClick, loading }: { label: string, icon?: ReactNode, variant: 'violet' | 'outline' | 'emerald', onClick?: () => void, loading?: boolean }) {
  const styles = {
    violet: "bg-violet-600 text-white shadow-xl shadow-violet-200 hover:bg-violet-700",
    outline: "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50",
    emerald: "bg-emerald-600 text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700"
  };
  
  return (
    <button
      disabled={loading}
      onClick={onClick}
      className={`w-full h-16 rounded-[1.25rem] ${styles[variant]} text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50`}
    >
      {loading ? <Loader2 className="animate-spin" size={16} /> : (
        <>
          {label}
          {icon}
        </>
      )}
    </button>
  );
}

function SidebarInfo({ icon, text }: { icon: ReactNode, text: string | undefined }) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
        {icon}
      </div>
      <p className="text-[11px] font-bold text-slate-500 line-clamp-1">{text || "Sin especificar"}</p>
    </div>
  );
}

const Loader2 = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    className={`animate-spin ${className}`} 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

const Trash2 = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2m-6 9h.01M15 15h.01" />
  </svg>
);