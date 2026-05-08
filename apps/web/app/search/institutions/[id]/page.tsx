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
  Heart,
  BookOpen,
  ShieldCheck,
  ArrowUpRight,
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
          schoolsService.getById(schoolId).catch(err => { throw err; }), // Critical
          coursesService.listBySchoolId(schoolId).catch(() => []), 
          schoolRatingsService.list({ schoolId, page: 1, pageSize: 20 }).catch(() => []),
          user ? schoolRatingsService.getMine(schoolId).catch(() => null) : Promise.resolve(null),
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
        if (mounted) {
          console.error("Error loading institution:", err);
          setError("No se pudo cargar la información esencial de la institución.");
        }
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
      
      const freshRatings = await schoolRatingsService.list({ schoolId: schoolId!, page: 1, pageSize: 20 });
      setRatings(freshRatings);
      setActionMessage("¡Gracias por tu opinión!");
    } catch (err) {
      setActionMessage("Error al enviar calificación.");
    } finally {
      setSubmittingRating(false);
    }
  }

  const [submittingRating, setSubmittingRating] = useState(false);

  const galleryItems = useMemo(() => {
    if (!school) return [];
    const items = [];
    if (school.coverImageUrl) {
      items.push({ label: "Principal", src: school.coverImageUrl, fit: "cover" });
    }
    if (school.gallery && school.gallery.length > 0) {
      school.gallery.forEach((url, i) => {
        items.push({ label: `Galería ${i + 1}`, src: url, fit: "cover" });
      });
    } else {
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
    <div className="bg-[#fcfcfd] min-h-screen selection:bg-indigo-50 selection:text-indigo-900 overflow-x-hidden">
      {/* 🌑 EXECUTIVE NAV */}
      <nav className="fixed inset-x-0 top-0 z-[100] px-6 py-6 pointer-events-none">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center pointer-events-auto">
          <motion.button 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => router.back()}
            className="group flex items-center gap-3 px-6 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-100 transition-all active:scale-95 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
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
              ? 'bg-indigo-600 text-white border-indigo-600' 
              : 'bg-white/80 backdrop-blur-xl text-slate-400 border-slate-200/50 hover:text-indigo-600'
            }`}
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            <span>{isFavorite ? 'Guardado' : 'Favorito'}</span>
          </motion.button>
        </div>
      </nav>

      {/* 🏙️ IMMERSIVE HERO */}
      <section className="relative h-[65vh] min-h-[550px] w-full overflow-hidden">
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
              src={galleryItems[activeImageIndex].src} 
              alt="Hero" 
              fill 
              className="object-cover"
              priority
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-[#fcfcfd]" />
          </motion.div>
        </AnimatePresence>

        {/* Hero Content Overlay */}
        <div className="absolute inset-x-0 bottom-0 px-8 pb-12">
          <div className="max-w-7xl mx-auto flex flex-col gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                 <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black text-white uppercase tracking-[0.3em]">
                   {school.institutionType || "Privada"}
                 </span>
                 <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                   <Star size={10} fill="currentColor" />
                   {school.averageRating?.toFixed(1) || "5.0"}
                 </div>
              </div>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-950 tracking-tight leading-[1.1] max-w-5xl">
                {school.name}
              </h1>
              <div className="flex items-center gap-4 text-slate-600 font-bold uppercase tracking-widest text-[11px]">
                 <MapPin size={16} className="text-indigo-600" />
                 {school.city}, {school.address}
              </div>
            </motion.div>

            {/* Gallery Mini-Nav */}
            <div className="flex gap-3 p-3 bg-white/10 backdrop-blur-3xl border border-white/10 rounded-3xl self-start">
               {galleryItems.slice(0, 5).map((img, i) => (
                 <button 
                   key={i}
                   onClick={() => setActiveImageIndex(i)}
                   className={`relative w-14 h-14 rounded-2xl overflow-hidden border-2 transition-all duration-500 ${activeImageIndex === i ? 'border-white scale-105 shadow-2xl' : 'border-transparent opacity-40 hover:opacity-100 hover:scale-105'}`}
                 >
                   <Image src={img.src} alt="Thumb" fill className="object-cover" unoptimized />
                 </button>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 💳 FULL WIDTH CONVERSION BAR */}
      <section className="sticky top-24 z-50 px-8 pt-8 pb-2">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-7xl mx-auto bg-white/80 backdrop-blur-3xl border border-slate-100 rounded-[3.5rem] shadow-[0_40px_80px_rgba(0,0,0,0.08)] p-3 grid grid-cols-1 md:grid-cols-4 items-center gap-4"
        >
          {/* PRICE BLOCK */}
          <div className="flex flex-col items-center justify-center h-16 border-b md:border-b-0 md:border-r border-slate-100">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Mensualidad</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl lg:text-3xl font-black text-slate-950 tracking-tighter">
                {school.monthlyPrice ? `$${school.monthlyPrice.toLocaleString()}` : "$8,500"}
              </span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">MXN</span>
            </div>
          </div>

          {/* BUTTONS (Symmetric Grid) */}
          <button 
            onClick={() => handleInteraction("Me gustaría recibir más información", "INFO_REQUEST")}
            className="h-16 rounded-[1.5rem] bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-indigo-100"
          >
            Solicitar Información
            <ArrowUpRight size={14} />
          </button>
          
          <button 
            onClick={() => handleInteraction("Deseo agendar una visita a sus instalaciones", "SCHEDULE_VISIT")}
            className="h-16 rounded-[1.5rem] bg-white border border-slate-200 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Agendar Visita
          </button>
          
          <button 
            onClick={handleEnroll}
            className="h-16 rounded-[1.5rem] bg-emerald-600 text-white text-[10px) font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-lg shadow-emerald-100"
          >
            Inscribirme
          </button>
        </motion.div>
      </section>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-24">
        
        {/* 📝 DESCRIPTION - FULL WIDTH */}
        <section className="relative bg-white border border-slate-100 p-10 lg:p-16 rounded-[3.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 blur-[120px] rounded-full -mr-32 -mt-32" />
          
          <div className="relative space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.4em]">Propuesta Académica</h2>
                <div className="h-px w-12 bg-indigo-100 hidden md:block" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {school.educationalLevel && (
                  <span className="px-4 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                    {school.educationalLevel}
                  </span>
                )}
                {school.categories?.map((cat) => cat && (
                  <span key={cat.id} className="px-4 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                    {cat.name}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-lg lg:text-xl leading-[1.6] text-slate-700 font-medium tracking-tight">
              {school.description || "Un entorno de excelencia diseñado para formar a los líderes del mañana a través de la innovación y valores sólidos."}
            </div>
          </div>
        </section>

        {/* 🍱 BENTO STATS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard icon={<Clock3 size={20} />} label="Horario" value={school.schedule || "Matutino"} color="indigo" />
          <StatCard icon={<Languages size={20} />} label="Idiomas" value={school.languages || "Español"} color="indigo" />
          <StatCard icon={<Users size={20} />} label="Alumnos" value={`${school.maxStudentsPerClass || 25} / Aula`} color="indigo" />
          <StatCard icon={<ClipboardCheck size={20} />} label="Admisión" value={school.enrollmentOpen ? "Abierta" : "Cerrada"} color={school.enrollmentOpen ? "emerald" : "indigo"} />
        </div>

        {/* 🎓 CURSOS / PROGRAMAS */}
        {courses.length > 0 && (
          <section className="space-y-12">
            <div className="flex items-center gap-4">
              <h2 className="text-[11px] font-black text-slate-950 uppercase tracking-[0.4em]">Programas Disponibles</h2>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courses.map((c) => (
                <motion.div 
                  key={c.id}
                  whileHover={{ y: -5, scale: 1.01 }}
                  onClick={() => router.push(`/search/course/${c.id}`)}
                  className="group flex items-center justify-between p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-950 tracking-tight">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{c.modality || "Presencial"}</p>
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <ArrowRight size={18} />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* 🗺️ MAP */}
        <section className="space-y-10">
           <div className="flex items-center gap-4">
             <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Ubicación</h2>
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

        {/* 💬 REVIEWS */}
        <section className="space-y-12 pb-20">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.4em]">Opiniones de la Comunidad</h2>
            {!user && (
              <button onClick={() => router.push('/auth/login')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
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
                <h3 className="text-xl font-black text-indigo-900 tracking-tight">¿Qué te parece esta institución?</h3>
                <p className="text-sm font-medium text-indigo-900/40">Tu opinión ayuda a otros padres a tomar la mejor decisión.</p>
              </div>

              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${userRating >= star ? 'bg-amber-400 text-white shadow-lg shadow-amber-100' : 'bg-white text-slate-300 hover:text-amber-300'}`}
                    >
                      <Star size={24} fill={userRating >= star ? "currentColor" : "none"} />
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
  const bg = color === 'emerald' ? 'bg-emerald-50' : 'bg-slate-50';
  const text = color === 'emerald' ? 'text-emerald-600' : 'text-indigo-600';
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