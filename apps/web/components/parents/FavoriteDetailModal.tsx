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
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { trackLead } = useLeadTracking({ userId: user?.id || "" });
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
  const locationLabel = item.address ? `${item.address}${item.city ? `, ${item.city}` : ''}` : (item.location || 'Ubicación por definir');
  const infoRows = [
    { icon: MapPin, label: 'Ubicación', value: locationLabel },
    { icon: Clock3, label: 'Horario', value: item.schedule || 'Horario por confirmar' },
    { icon: Users, label: 'Capacidad', value: item.studentsPerClass ? `${item.studentsPerClass} lugares` : 'Cupos disponibles' },
    { icon: Languages, label: 'Idiomas', value: item.languages || (isCourse ? 'Según programa' : 'Por confirmar') },
  ];

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

  const handleViewMore = async () => {
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
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/35 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-[101] flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-[0_40px_100px_-35px_rgba(15,23,42,0.4)] md:grid md:grid-cols-[minmax(0,1.1fr)_420px]">
        <button
          className="absolute right-5 top-5 z-50 grid h-10 w-10 place-items-center rounded-2xl bg-white/90 text-slate-700 shadow-md transition hover:bg-white"
          aria-label="Cerrar"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative min-h-[320px] bg-slate-100">
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

          {hasMultipleImages && (
            <>
              <div className="pointer-events-none absolute inset-x-5 top-1/2 flex -translate-y-1/2 justify-between">
                <button
                  type="button"
                  onClick={goToPrevImage}
                  className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextImage}
                  className="pointer-events-auto grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-white backdrop-blur-md transition hover:bg-white hover:text-slate-900"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-md">
                {modalImages.map((_, index) => (
                  <button
                    key={`modal-dot-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`h-1.5 rounded-full transition ${
                      currentImageIndex === index ? 'w-7 bg-white' : 'w-1.5 bg-white/45 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col overflow-y-auto p-7 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 pr-12">
            <span className={`rounded-full ${accentBgClass} px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${accentClass}`}>
              {item.level ?? (isCourse ? 'Curso' : 'Escuela')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[10px] font-semibold text-amber-700">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {typeof item.rating === 'number' ? item.rating.toFixed(1) : '5.0'}
            </span>
            {item.badges?.slice(0, 2).map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-slate-200 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500"
              >
                {badge}
              </span>
            ))}
          </div>

          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
            {item.title}
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {item.description || 'Explora una propuesta educativa clara, directa y lista para comparar sin ruido visual.'}
          </p>

          {item.onlineInstructions && (
            <div className="mt-6 rounded-[1.5rem] border border-violet-100 bg-violet-50 px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-white p-2 text-violet-600">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-500">
                    Indicaciones online
                  </p>
                  <p className="mt-1 text-sm leading-6 text-violet-950">
                    {item.onlineInstructions}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-7 space-y-3">
            {infoRows.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl ${accentBgClass} p-2 ${accentClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {label}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 rounded-[1.75rem] border border-slate-200 bg-white px-5 py-5 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.4)]">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              Inversión
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-3xl font-semibold text-slate-950">{priceValue || '—'}</span>
              <span className="pb-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
                {priceUnit || 'referencia'}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleContact}
                disabled={sending}
                className={`inline-flex h-12 flex-1 items-center justify-center rounded-2xl px-5 text-sm font-semibold text-white transition ${accentButtonClass} disabled:opacity-50`}
              >
                {sending ? 'Enviando...' : 'Solicitar información'}
              </button>

              <button
                onClick={handleViewMore}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-900 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Ver ficha completa
                <ArrowUpRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
