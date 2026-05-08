'use client';

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, ImageIcon, MapPin, ArrowRight, Users, Star, TrendingUp, Check } from "lucide-react";
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
  isComparing?: boolean;
  onCompareToggle?: (e?: React.MouseEvent) => void;
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
  isComparing = false,
  onCompareToggle,
}: CatalogCardProps) {
  const router = useRouter();
  const safeImageSrc = sanitizeImageSrc(imageSrc);
  // Log para depuración
  console.log("CatalogCard props", { priceFormatted, title, name: title });

  const isPremium = planName === "PREMIUM_SUBSCRIPTION";

  return (
    <article
      onClick={onCardClick}
      className={`group relative flex flex-col overflow-hidden rounded-2xl bg-white border-2 transition-all duration-300 ${
        isComparing 
          ? 'border-indigo-600 shadow-xl shadow-indigo-100' 
          : 'border-slate-100 hover:shadow-xl hover:shadow-indigo-50/50 hover:border-indigo-100'
      } ${
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

        {/* Selected Overlay */}
        {isComparing && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-indigo-600/10 backdrop-blur-[1px]">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg animate-in zoom-in duration-300">
              <Check size={28} className="stroke-[3px]" />
            </div>
          </div>
        )}
        
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

        {/* Comparison Toggle Bar */}
        {onCompareToggle && (
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onCompareToggle?.(e);
            }}
            className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-slate-100 bg-white/80 px-4 py-2.5 backdrop-blur-md transition-all hover:bg-white"
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={12} className={isComparing ? "text-indigo-600" : "text-slate-400"} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${isComparing ? "text-indigo-600" : "text-slate-500"}`}>
                {isComparing ? "Seleccionada" : "Comparar"}
              </span>
            </div>
            <div className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all ${
              isComparing 
                ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200" 
                : "bg-white border-slate-200"
            }`}>
              {isComparing && <Check size={12} className="text-white stroke-[3px]" />}
            </div>
          </div>
        )}

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
            <span className="text-sm font-black text-slate-900">{priceFormatted}</span>
            <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">/ mes</span>
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