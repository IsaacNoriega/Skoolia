'use client';
import Image from 'next/image';
import { X, MapPin, Star, ChevronLeft, ChevronRight, Users, Clock3, Languages, ImageIcon, ArrowUpRight, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { messagesService } from '@/lib/services/services/messages.service';
import { courseMessagesService } from '@/lib/services/services/course-messages.service';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLeadTracking } from '@/lib/hooks/useLeadTracking';
import { sanitizeImageSrc } from '@/lib/utils';

type Item = {
  id?: string;
  imageUrl?: string;
  badges?: string[];
  level?: string;
  title: string;
  location: string;
  price: string | number;
  description?: string;
  rating?: number;
  schedule?: string; // e.g., "7:30 AM - 2:30 PM"
  studentsPerClass?: number | string; // e.g., 20
  languages?: string; // e.g., "Bilingüe (Cert. Oxford)"
  enrollmentStatus?: string; // e.g., "Abiertas 2026"
  enrollmentOpen?: boolean;
  enrollmentYear?: number;
  monthlyPrice?: number;
  gallery?: string[];
  address?: string;
  city?: string;
  onlineInstructions?: string;
};

export default function FavoriteDetailModal({
  open,
  onClose,
  item,
  onRatingUpdated,
}: {
  open: boolean;
  onClose: () => void;
  item?: Item;
  onRatingUpdated?: (schoolId: string, averageRating?: number) => void;
}): JSX.Element | null {
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [item?.id, open]);

  if (!open || !item) return null;

  const generatedCovers = item.id
    ? [
        `https://picsum.photos/seed/${item.id}-modal-1/1200/800`,
        `https://picsum.photos/seed/${item.id}-modal-2/1200/800`,
        `https://picsum.photos/seed/${item.id}-modal-3/1200/800`,
      ]
    : [
        `https://picsum.photos/seed/${encodeURIComponent(item.title)}-modal-1/1200/800`,
        `https://picsum.photos/seed/${encodeURIComponent(item.title)}-modal-2/1200/800`,
        `https://picsum.photos/seed/${encodeURIComponent(item.title)}-modal-3/1200/800`,
      ];

  const modalImages = Array.from(
    new Set(
      [
        item.imageUrl, 
        ...(item.gallery && item.gallery.length > 0 ? item.gallery : generatedCovers)
      ]
        .map((url) => sanitizeImageSrc(url))
        .filter(
          (url): url is string => Boolean(url),
        ),
    ),
  );

  const hasMultipleImages = modalImages.length > 1;

  const goToPrevImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) =>
      prev === 0 ? modalImages.length - 1 : prev - 1,
    );
  };

  const goToNextImage = () => {
    if (!hasMultipleImages) return;
    setCurrentImageIndex((prev) =>
      prev === modalImages.length - 1 ? 0 : prev + 1,
    );
  };

  const numericPrice = typeof item.price === 'number' ? item.price : (typeof item.monthlyPrice === 'number' ? item.monthlyPrice : undefined);
  const priceValue = numericPrice != null
    ? `$${numericPrice.toLocaleString('es-MX')}`
    : (String(item.price).match(/\$\s?[\d,.]+/)?.[0] ?? String(item.price));
  const priceUnit = numericPrice != null ? 'MXN/mes' : (String(item.price).includes('MXN/mes') ? 'MXN/mes' : '');

  const isCourse = item.level === 'CURSO' || item.level === 'CURSOS' || item.level === 'CURSO ACADÉMICO' || item.level === 'ACADEMICO' || item.level === 'ACADÉMICO';
  const accentClass = isCourse ? 'text-violet-600' : 'text-indigo-600';
  const accentBgClass = isCourse ? 'bg-violet-50' : 'bg-indigo-50';
  const accentButtonClass = isCourse ? 'bg-violet-600 hover:bg-violet-700' : 'bg-indigo-600 hover:bg-indigo-700';

  const handleContact = async () => {
    if (!item.id || sending) return;

    try {
      setSending(true);
      if (isCourse) {
        if (!user) throw new Error('Usuario no autenticado');
        await courseMessagesService.sendCourseMessage(item.id, 'Hola, me interesa conocer más información de este curso.', { id: user.id, role: user.role });
        await trackLead({
          targetId: item.id,
          originType: "COURSE",
          trigger: "INFO_REQUEST",
          status: "INTERESADO",
        });
        onClose();
        router.push(`/parents/messages/courses/${item.id}`);
      } else {
        if (!user) throw new Error('Usuario no autenticado');
        await messagesService.sendParentMessage(item.id, 'Hola, me interesa conocer mas informacion de su escuela.', user.id);
        await trackLead({
          targetId: item.id,
          originType: "SCHOOL",
          trigger: "INFO_REQUEST",
          status: "INTERESADO",
        });
        onClose();
        router.push(`/parents/messages/${item.id}`);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-md" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-[101] w-full max-w-6xl overflow-hidden rounded-[3.5rem] bg-white shadow-[0_50px_100px_-20px_rgba(0,0,0,0.25)] transition-all max-h-[90vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          className="absolute right-8 top-8 z-50 grid h-12 w-12 place-items-center rounded-2xl bg-white/80 backdrop-blur-md text-slate-700 shadow-xl transition-all hover:scale-110 active:scale-95 hover:bg-white"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        {/* Left Section: Media */}
        <div className="relative h-72 w-full md:h-auto md:w-[50%] bg-slate-100 overflow-hidden">
          {modalImages.length > 0 ? (
            <Image
              src={modalImages[currentImageIndex]}
              alt={item.title}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              priority={true}
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-200">
              <ImageIcon className="h-16 w-16" />
            </div>
          )}

          {/* Navigation Controls */}
          {hasMultipleImages && (
            <>
              <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-between pointer-events-none">
                <button
                  type="button"
                  onClick={goToPrevImage}
                  className="pointer-events-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/30 transition-all hover:bg-white hover:text-slate-900 hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="pointer-events-auto grid h-12 w-12 place-items-center rounded-2xl bg-white/20 text-white shadow-lg backdrop-blur-md border border-white/30 transition-all hover:bg-white hover:text-slate-900 hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              {/* Progress Bar Dots */}
              <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/20 px-4 py-2 backdrop-blur-xl border border-white/10">
                {modalImages.map((_, index) => (
                  <button
                    key={`modal-dot-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 transition-all duration-500 rounded-full ${
                      currentImageIndex === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Right Section: Content */}
        <div className="flex flex-1 flex-col overflow-y-auto p-10 md:p-12 lg:p-16">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`rounded-full ${accentBgClass} px-4 py-1 text-[9px] font-bold uppercase tracking-widest ${accentClass} border border-transparent`}>
                {item.level ?? (isCourse ? 'CURSO' : 'ESCUELA')}
              </span>
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-full border border-amber-100">
                <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                <span className="text-[10px] font-black text-amber-700">
                  {typeof item.rating === 'number' ? item.rating.toFixed(1) : '5.0'}
                </span>
              </div>
            </div>
          </div>

          <h2 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            {item.title}
          </h2>

          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-slate-400">
            <MapPin className="h-4 w-4 shrink-0 text-slate-300" />
            <span>{item.address ? `${item.address}, ${item.city}` : (item.location || 'Ubicación por definir')}</span>
          </div>

          <div className="mt-10 space-y-12">
            {/* Description Section */}
            <div className="space-y-3">
               <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">Resumen</h3>
               <p className="text-base leading-relaxed text-slate-600 font-medium">
                 {item.description || 'Explora una propuesta educativa de vanguardia diseñada para potenciar el talento y la curiosidad de los estudiantes en un entorno seguro y estimulante.'}
               </p>
               {item.onlineInstructions && (
                 <div className="mt-4 p-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-start gap-3">
                   <Globe className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                   <div>
                     <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Instrucciones Online</p>
                     <p className="text-sm font-medium text-violet-900">{item.onlineInstructions}</p>
                   </div>
                 </div>
               )}
            </div>

            {/* Bento Grid Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="group flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-50">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accentBgClass} ${accentClass} transition-transform group-hover:rotate-6`}>
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Capacidad</p>
                  <p className="text-sm font-bold text-slate-900">{item.studentsPerClass || '25'} alumnos</p>
                </div>
              </div>

              <div className="group flex items-center gap-4 rounded-2xl bg-slate-50 p-5 border border-slate-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-slate-50">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform group-hover:-rotate-6`}>
                  <Languages className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Idiomas</p>
                  <p className="text-sm font-bold text-slate-900">{item.languages || 'Bilingüe'}</p>
                </div>
              </div>
            </div>

            {/* Community Experience (Simplified Ratings) */}
            <div className="space-y-6 pt-4 border-t border-slate-50">
              <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">Experiencia de la Comunidad</h3>
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-3xl font-black text-slate-900">
                    {typeof item.rating === 'number' ? item.rating.toFixed(1) : '5.0'}
                  </div>
                  <div className="flex justify-center gap-0.5 mt-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={8} fill={i < (item.rating || 5) ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-[11px] text-slate-500 italic leading-relaxed">
                    "Excelente ambiente educativo y personal altamente calificado. Las instalaciones son de primer nivel."
                  </p>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">— Padre de familia</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-10 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="flex flex-col">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-300">Inversión Estimada</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold text-slate-900">{priceValue || '—'}</span>
                <span className="text-[10px] font-bold text-slate-400">MXN/MES</span>
              </div>
            </div>

            <div className="flex w-full sm:w-auto items-center gap-3">
              <button
                onClick={handleContact}
                disabled={sending}
                className={`flex-1 sm:flex-none h-14 px-8 rounded-xl ${accentButtonClass} text-white text-[11px] font-bold uppercase tracking-widest transition-all hover:shadow-xl hover:shadow-indigo-100 active:scale-95 disabled:opacity-50`}
              >
                {sending ? 'Enviando...' : 'Contactar'}
              </button>
              
              <button
                onClick={async () => {
                  if (!item.id) return;
                  if (user?.id) {
                    await trackLead({
                      targetId: item.id,
                      originType: isCourse ? "COURSE" : "SCHOOL",
                      trigger: "VIEW_MORE",
                      status: "INTERESADO",
                    });
                  }
                  onClose();
                  router.push(isCourse ? `/search/course/${item.id}` : `/search/institutions/${item.id}`);
                }}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-95 shadow-sm"
                title="Ver perfil completo"
              >
                <ArrowUpRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
