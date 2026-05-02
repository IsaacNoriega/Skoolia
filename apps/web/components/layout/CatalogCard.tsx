'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ImageIcon, MapPin, ArrowRight, Users, Star } from "lucide-react";
import React from "react";
import { sanitizeImageSrc } from "@/lib/utils";
import { PlanBadge } from "./PlanBadge";

type CatalogCardProps = {
  imageSrc?: string;
  imageAlt?: string;
  tags?: string[];
  typeLabel: string;
  title: string;
  location: string;
  priceLabel?: string;
  priceFormatted: string;
  price?: number | string;
  href?: string;
  onAction?: () => void;
  onCardClick?: () => void;
  isFavorite?: boolean;
  onFavoriteToggle?: (e?: React.MouseEvent) => void;
  className?: string;
  languages?: string;
  studentsPerClass?: number | string;
  description?: string;
  institutionType?: string;
  planName?: string;
};

export default function CatalogCard({
  imageSrc,
  imageAlt = "",
  tags = [],
  price,
  typeLabel,
  title,
  location,
  priceLabel = "MENSUALIDAD",
  href,
  onAction,
  onCardClick,
  isFavorite = false,
  onFavoriteToggle,
  priceFormatted,
  className = "",
  languages,
  studentsPerClass,
  description,
  institutionType,
  planName,
}: CatalogCardProps) {
  const router = useRouter();
  const safeImageSrc = sanitizeImageSrc(imageSrc);
  // Log para depuración
  console.log("CatalogCard props", { priceFormatted, title, name: title });

  const isPremium = planName === "PREMIUM_SUBSCRIPTION";

  return (
    <article
      onClick={onCardClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-100 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100 ${
        onCardClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {/* Media Section */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
        {safeImageSrc ? (
          <Image
            src={safeImageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            priority={false}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50">
            <ImageIcon className="h-10 w-10 text-slate-200" />
          </div>
        )}
        
        {/* Favorite Button */}
        <div className="absolute right-3 top-3 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onFavoriteToggle?.(e);
            }}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-slate-400 border border-slate-100 shadow-sm transition-colors hover:text-rose-500"
          >
            <Heart size={16} className={`transition-all duration-300 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`} />
          </button>
        </div>

        {/* Level Badge */}
        <div className="absolute left-3 top-3 z-20 flex flex-col gap-2">
           <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md border border-slate-100 rounded-full text-[9px] font-bold text-indigo-600 uppercase tracking-widest">
              {typeLabel}
           </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-900 tracking-tight transition-colors group-hover:text-indigo-600">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 text-slate-400">
             <MapPin size={10} className="text-indigo-400" />
             <span className="uppercase tracking-widest text-[8px] font-bold">{location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-900">5.0</span>
          </div>
          
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-bold text-slate-900">${price}</span>
            <span className="text-[7px] font-bold text-slate-300 uppercase tracking-widest">/ mes</span>
          </div>
        </div>

        <button
          onClick={onAction}
          className="w-full py-2.5 mt-1 rounded-lg bg-slate-900 text-white text-[9px] font-bold uppercase tracking-widest transition-all hover:bg-indigo-600 active:scale-95"
        >
          Ver Detalles
        </button>
      </div>
    </article>
  );
}