'use client';
import Image from 'next/image';
import { X, MapPin, Star, ChevronLeft, ChevronRight, Users, Clock3, Languages, ImageIcon, ArrowUpRight, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { messagesService } from '@/lib/services/services/messages.service';
import { courseMessagesService } from '@/lib/services/services/course-messages.service';
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
  schedule?: string;
  studentsPerClass?: number | string;
  languages?: string;
  enrollmentStatus?: string;
  enrollmentOpen?: boolean;
  enrollmentYear?: number;
  monthlyPrice?: number;
  gallery?: string[];
  address?: string;
  city?: string;
  onlineInstructions?: string;
  institutionType?: string;
  coverImageUrl?: string;
  logoUrl?: string;
  logo?: string;
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
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
  const [sending, setSending] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setCurrentImageIndex(0);
    setIsExpanded(false);
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
        item.coverImageUrl,
        item.imageUrl, 
        item.logoUrl,
        item.logo,
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

  const handleContact = async () => {
    if (!item.id || sending) return;
    if (!user) {
      onClose();
      router.push('/auth/login');
      return;
    }

    try {
      setSending(true);
      if (isCourse) {
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
    } catch {
      return;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[101] flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl md:flex-row">
        {/* Left Section: Image Carousel */}
        <div className="relative h-64 w-full bg-slate-100 md:h-auto md:w-1/2">
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
            <div className="flex h-full items-center justify-center text-slate-300">
              <ImageIcon className="h-16 w-16" />
            </div>
          )}

          {hasMultipleImages && (
            <>
              <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
                <button
                  type="button"
                  onClick={goToPrevImage}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>

              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/20 px-3 py-1.5 backdrop-blur-md">
                {modalImages.map((_, index) => (
                  <button
                    key={`modal-dot-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentImageIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          <button
            className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-700 shadow-md transition hover:bg-white md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Right content */}
        <div className="p-6 sm:p-10 flex flex-col h-full flex-1 overflow-y-auto">
          <button
            className="hidden md:grid absolute right-6 top-6 h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`rounded-full ${accentBgClass} px-3 py-1 text-[11px] font-extrabold tracking-widest ${accentClass}`}>
              {item.level ?? (isCourse ? 'CURSO' : 'ESCUELA')}
            </span>
            <span className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">Skoolia Certified</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-slate-900 mb-2">{item.title}</h2>
          
          <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span>{item.location || 'Sin ubicación'}</span>
            <div className="w-1 h-1 rounded-full bg-slate-300 mx-1" />
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              <span className="font-bold">{typeof item.rating === 'number' ? item.rating.toFixed(1) : '5.0'}</span>
            </div>
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <div className="relative">
              <p className={`text-sm leading-relaxed text-slate-700 whitespace-pre-line ${!isExpanded && item.description && item.description.length > 280 ? "line-clamp-4" : ""}`}>
                {item.description?.trim() ? item.description : 'Explora una propuesta educativa diseñada para potenciar el talento y la curiosidad en un entorno seguro y estimulante.'}
              </p>
              
              {item.description && item.description.length > 280 && (
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {isExpanded ? "Ver menos" : "Leer más"}
                </button>
              )}
            </div>
          </div>

          {/* Grid de atributos */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <Clock3 className="w-5 h-5 text-indigo-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Horario</div>
                <div className="text-xs font-extrabold text-slate-700 line-clamp-1">{item.schedule || '7:30 AM - 2:30 PM'}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <Languages className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Idiomas</div>
                <div className="text-xs font-extrabold text-slate-700 line-clamp-1">{item.languages || 'Bilingüe'}</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-pink-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Capacidad</div>
                <div className="text-xs font-extrabold text-slate-700">{item.studentsPerClass || '25'} alumnos</div>
              </div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
              <Globe className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tipo</div>
                <div className="text-xs font-extrabold text-slate-700 line-clamp-1">{item.institutionType || 'Privada'}</div>
              </div>
            </div>
          </div>

          {/* Inscripciones */}
          <div className="mb-8">
            {item.enrollmentOpen ? (
              <div className="flex items-center gap-3 bg-emerald-50 rounded-2xl px-5 py-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">Inscripciones abiertas</span>
                {item.enrollmentYear && (
                  <span className="ml-auto bg-emerald-100 text-emerald-800 rounded-full px-3 py-1 text-[10px] font-black">
                    Ciclo {item.enrollmentYear}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-5 py-3">
                <div className="h-2 w-2 rounded-full bg-slate-300" />
                <span className="text-xs font-bold text-slate-500">Inscripciones cerradas</span>
              </div>
            )}
          </div>

          {/* Footer: Precio y Botones */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-slate-100 pt-8">
            <div>
              <div className="text-[10px] font-black tracking-[0.15em] text-slate-400 uppercase">Mensualidad</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-3xl font-black text-emerald-600">{priceValue || '—'}</span>
                <span className="text-xs font-bold text-emerald-600/70">{priceUnit || 'MXN'}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                className="flex-1 sm:flex-none rounded-full bg-slate-900 px-8 py-3.5 text-xs font-black text-white shadow-lg transition hover:bg-indigo-600 active:scale-95 disabled:opacity-50"
                onClick={handleContact}
                disabled={sending}
              >
                {sending ? 'Enviando...' : 'CONTACTAR'}
              </button>
              <button
                className="group flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all hover:border-slate-300 hover:text-slate-900 active:scale-95"
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
              >
                <ArrowUpRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
