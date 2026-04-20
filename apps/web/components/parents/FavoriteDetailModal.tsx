'use client';
import Image from 'next/image';
import { X, MapPin, Star, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { JSX, useEffect, useState } from 'react';
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
      [item.imageUrl, ...generatedCovers]
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
    ? `$${numericPrice.toLocaleString()}`
    : (String(item.price).match(/\$\s?[\d,.]+/)?.[0] ?? String(item.price));
  const priceUnit = numericPrice != null ? 'MXN/mes' : (String(item.price).includes('MXN/mes') ? 'MXN/mes' : '');

  const handleContact = async () => {
    if (!item.id || sending) return;

    try {
      setSending(true);
      // Detectar si es curso o escuela por la presencia de alguna propiedad o convención
      const isCourse = item.level === 'CURSO' || item.level === 'CURSOS' || item.level === 'CURSO ACADÉMICO' || item.level === 'ACADEMICO' || item.level === 'ACADÉMICO';
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
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-101 mx-4 w-full max-w-6xl overflow-hidden rounded-2xl sm:rounded-4xl bg-white surface max-h-[90vh]">
        <button
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_520px]">
          {/* Left media */}
          <div className="relative h-65 sm:h-80 md:h-[72vh] w-full bg-slate-100">
            {modalImages.length > 0 ? (
              <Image
                src={modalImages[currentImageIndex]}
                alt={item.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Imagen</div>
            )}

            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  onClick={goToPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-slate-700 shadow hover:bg-white"
                  aria-label="Portada anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full bg-white/85 text-slate-700 shadow hover:bg-white"
                  aria-label="Siguiente portada"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full bg-slate-900/45 px-3 py-1.5">
                  {modalImages.map((_, index) => (
                    <button
                      key={`favorite-modal-dot-${index}`}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      aria-label={`Ir a portada ${index + 1}`}
                      className={`h-2.5 w-2.5 rounded-full transition ${
                        currentImageIndex === index
                          ? 'bg-white'
                          : 'bg-white/50 hover:bg-white/80'
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {/* Right content */}
          <div className="p-5 sm:p-8 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold tracking-widest text-indigo-700">
                {item.level ?? 'ESCUELA'}
              </span>
              <span className="text-[11px] font-bold tracking-widest text-slate-400">FUTURE TECH GLOBAL</span>
            </div>
            <h2 className="text-2xl sm:text-[28px] font-extrabold leading-tight text-slate-900 mb-1">{item.title}</h2>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 mb-2">
              <MapPin className="h-4 w-4" />
              <span>{item.location || 'Sin ubicación'}</span>
              <Star className="h-4 w-4 text-amber-400" />
              <span>
                {typeof item.rating === 'number' ? item.rating.toFixed(1) : '—'}
                {typeof item.rating === 'number' ? ' (valoración)' : ''}
              </span>
            </div>

            {/* Descripción */}
            <div className="mb-3">
              <p className="text-xs sm:text-sm leading-relaxed text-slate-700 max-h-[120px] overflow-y-auto">
                {item.description?.trim() ? item.description : 'Sin descripción registrada.'}
              </p>
            </div>

            {/* Grid de atributos */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3">
              {/* Horario */}
              <div className="bg-slate-50 rounded-2xl p-3 flex-1 flex items-center gap-2 min-h-[64px]">
                <svg className="w-5 h-5 text-indigo-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">Horario</div>
                  <div className="text-xs font-bold text-slate-700">{item.schedule?.trim() ? item.schedule : 'No registrado'}</div>
                </div>
              </div>
              {/* Idiomas */}
              <div className="bg-slate-50 rounded-2xl p-3 flex-1 flex items-center gap-2 min-h-[64px]">
                <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6m0 0V4m0 10l3-3m-3 3l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">Idiomas</div>
                  <div className="text-xs font-bold text-slate-700">{item.languages?.trim() ? item.languages : 'No registrado'}</div>
                </div>
              </div>
              {/* Alumnos por salón */}
              <div className="bg-slate-50 rounded-2xl p-3 flex-1 flex items-center gap-2 min-h-[64px]">
                <Users className="w-5 h-5 text-pink-400 shrink-0" />
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">Alumnos por salón</div>
                  <div className="text-xs font-bold text-slate-700">{item.studentsPerClass != null && String(item.studentsPerClass).trim() !== '' ? item.studentsPerClass : 'No registrado'}</div>
                </div>
              </div>
              {/* Tipo de institución */}
              <div className="bg-slate-50 rounded-2xl p-3 flex-1 flex items-center gap-2 min-h-[64px]">
                <svg className="w-5 h-5 text-blue-400 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 10l9-7 9 7v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold">Tipo de institución</div>
                  <div className="text-xs font-bold text-slate-700">{item.institutionType?.trim() ? item.institutionType : 'No registrado'}</div>
                </div>
              </div>
            </div>

            {/* Banner de inscripción */}
            <div className="mb-3">
              {item.enrollmentOpen ? (
                <div className="flex items-center gap-2 bg-emerald-50 rounded-2xl px-4 py-2 min-h-[40px]">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 mr-2"></span>
                  <span className="text-xs font-semibold text-emerald-700">Inscripciones abiertas</span>
                  {item.enrollmentYear ? (
                    <span className="ml-2 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-[11px] font-bold">
                      {item.enrollmentYear}
                    </span>
                  ) : null}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-slate-100 rounded-2xl px-4 py-2 min-h-[40px]">
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-400 mr-2"></span>
                  <span className="text-xs font-semibold text-slate-500">Inscripciones cerradas</span>
                  {item.enrollmentYear ? (
                    <span className="ml-2 bg-slate-200 text-slate-700 rounded-full px-3 py-1 text-[11px] font-bold">
                      {item.enrollmentYear}
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* Precio mensual y botones alineados */}
            <div className="mt-auto mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <div className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-500">MENSUALIDAD</div>
                <div className="mt-2 text-3xl sm:text-4xl font-extrabold text-emerald-700">{priceValue || '—'}</div>
                {priceUnit ? (
                  <div className="-mt-1 text-lg sm:text-xl font-extrabold text-emerald-700">{priceUnit}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <button
                  className="flex-1 sm:flex-initial w-full sm:w-auto rounded-full bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={handleContact}
                  disabled={!item.id || sending}
                >
                  {sending ? 'Enviando...' : 'Contactar'}
                </button>
                <button
                  className="group flex-1 sm:flex-initial w-full sm:w-auto rounded-full border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:from-slate-50 hover:to-slate-100 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={async () => {
                    if (!item.id) return;
                    if (user?.id) {
                      await trackLead({
                        targetId: item.id,
                        originType: item.level && item.level.toLowerCase().includes("curso") ? "COURSE" : "SCHOOL",
                        trigger: "VIEW_MORE",
                        status: "INTERESADO",
                      });
                    }
                    onClose();
                    if (item.level && item.level.toLowerCase().includes("curso")) {
                      router.push(`/search/course/${item.id}`);
                    } else {
                      router.push(`/search/institutions/${item.id}`);
                    }
                  }}
                  disabled={!item.id}
                >
                  <span className="inline-flex items-center gap-1.5">
                    Ver más
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
