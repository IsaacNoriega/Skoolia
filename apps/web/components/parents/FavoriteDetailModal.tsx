'use client';
import Image from 'next/image';
import { X, MapPin, Star } from 'lucide-react';
import { JSX, useState } from 'react';
import { useRouter } from 'next/navigation';

import { messagesService } from '@/lib/services/services/messages.service';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/contexts/AuthContext';

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
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);

  if (!open || !item) return null;

  const numericPrice = typeof item.price === 'number' ? item.price : (typeof item.monthlyPrice === 'number' ? item.monthlyPrice : undefined);
  const priceValue = numericPrice != null
    ? `$${numericPrice.toLocaleString()}`
    : (String(item.price).match(/\$\s?[\d,.]+/)?.[0] ?? String(item.price));
  const priceUnit = numericPrice != null ? 'MXN/mes' : (String(item.price).includes('MXN/mes') ? 'MXN/mes' : '');

  const handleContact = async () => {
    if (!item.id || sending) return;

    try {
      setSending(true);
      await messagesService.sendParentMessage(item.id, 'Hola, me interesa conocer mas informacion de su escuela.');
      onClose();
      router.push(`/parents/messages/${item.id}`);
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
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority={false}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Imagen</div>
            )}
          </div>

          {/* Right content */}
          <div className="p-5 sm:p-8 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-extrabold tracking-widest text-indigo-700">
                {item.level ?? 'CURSO EXTRACURRICULAR'}
              </span>
              <span className="text-[11px] font-bold tracking-widest text-slate-400">FUTURE TECH GLOBAL</span>
            </div>
            <h2 className="mt-3 text-2xl sm:text-[28px] font-extrabold leading-tight text-slate-900">{item.title}</h2>
            <div className="mt-2 flex items-center gap-3 text-xs sm:text-sm text-slate-600">
              <MapPin className="h-4 w-4" />
              <span>{item.location}</span>
              <Star className="h-4 w-4 text-amber-400" />
              <span>
                {typeof item.rating === 'number' ? item.rating.toFixed(1) : '—'}
                {typeof item.rating === 'number' ? ' (valoración)' : ''}
              </span>
            </div>

            {/* Short description */}
            {item.description ? (
              <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-700">
                {item.description}
              </p>
            ) : null}

            <div className="mt-6 space-y-2 text-xs sm:text-sm text-slate-600">
              {item.schedule ? <p><span className="font-semibold">Horario:</span> {item.schedule}</p> : null}
              {item.languages ? <p><span className="font-semibold">Idiomas:</span> {item.languages}</p> : null}
              {item.studentsPerClass ? <p><span className="font-semibold">Alumnos por salón:</span> {item.studentsPerClass}</p> : null}
            </div>

            {/* Footer action */}
            <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-500">MENSUALIDAD ESTIMADA</p>
                <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">{priceValue}</p>
                {priceUnit ? (
                  <p className="-mt-1 text-lg sm:text-xl font-extrabold text-slate-900">{priceUnit}</p>
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
                  className="flex-1 sm:flex-initial w-full sm:w-auto rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (!item.id) return;
                    onClose();
                    router.push(`/search/institutions/${item.id}`);
                  }}
                  disabled={!item.id}
                >
                  Ver más
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
