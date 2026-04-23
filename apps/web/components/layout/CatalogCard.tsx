'use client';

import Image from "next/image";
import Link from "next/link";
import { Heart, ImageIcon, MapPin, ArrowRight, Users } from "lucide-react";
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
  const safeImageSrc = sanitizeImageSrc(imageSrc);
  // Log para depuración
  console.log("CatalogCard props", { priceFormatted, title, name: title });

  const isPremium = planName === "PREMIUM_SUBSCRIPTION";
  return (
    <article
      onClick={onCardClick}
      className={`surface group overflow-hidden rounded-4xl bg-white transition-all duration-300 border ${isPremium ? 'border-4 border-yellow-400 shadow-xl scale-[1.03]' : 'border-slate-200'} ${
        onCardClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'hover:-translate-y-0.5 hover:shadow-lg'
      } ${className}`}
    >
      {/* Media Section */}
      <div className="relative h-48 sm:h-56 md:h-64 w-full">
        {safeImageSrc ? (
          <Image
            src={safeImageSrc}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.05]"
            priority={false}
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-100">
            <div className="surface rounded-2xl bg-white p-4 text-slate-400">
              <ImageIcon className="h-8 w-8" />
            </div>
          </div>
        )}

        {/* Badge de plan */}
        {planName && (
          <div className="absolute left-4 top-4 z-10">
            <PlanBadge plan={planName} />
          </div>
        )}
        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="pointer-events-none absolute left-4 bottom-4 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Favorite */}
        <button
          type="button"
          aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle?.(e);
          }}
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-current text-red-500" : ""}`} />
        </button>
      </div>

      {/* Info Section */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4 sm:pt-5">
        <p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-indigo-600 uppercase">
          {typeLabel}
        </p>
        <h3 className="mt-2 text-base md:text-lg font-extrabold text-slate-900 transition-all duration-300 group-hover:text-indigo-600 group-hover:-translate-y-px line-clamp-2">
          {title}
        </h3>

        <div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>

        {/* Badges de Atributos */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {languages && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
              <span className="text-[10px]">🌐</span> {languages}
            </span>
          )}
          {studentsPerClass && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
              <Users className="w-3 h-3" /> {studentsPerClass} por salón
            </span>
          )}
          {institutionType && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 font-bold text-slate-700 border border-slate-200">
              🏢 {institutionType}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        <div className="my-4 sm:my-5 h-px w-full bg-slate-200/60" />

        <div className="flex items-center justify-between">
          <div>
            {price && (
              <p className="text-3xl md:text-3xl font-black text-indigo-700 leading-none">
                $ {price} MXN
              </p>
            )}
          </div>

          {href ? (
            <Link
              href={href}
              className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white shadow-md transition-all hover:bg-indigo-700 hover:scale-110"
            >
              <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="grid h-11 w-11 place-items-center rounded-full bg-slate-900 text-white shadow-md transition-all hover:bg-indigo-700 hover:scale-110"
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}