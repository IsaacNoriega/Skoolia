'use client';
import Image from "next/image";
import Link from "next/link";
import { Heart, ImageIcon, MapPin, ArrowRight } from "lucide-react";
import React from "react";
import { sanitizeImageSrc } from "@/lib/utils";

type CatalogCardProps = {
	imageSrc?: string;
	imageAlt?: string;
	tags?: string[];
	typeLabel: string; // e.g., "ESCUELA", "CURSO TECH"
	title: string;
	location: string; // e.g., "Polanco, CDMX"
	priceLabel?: string; // default: "MENSUALIDAD"
	price: number | string; // e.g., 12500 or "$12,500"
	priceFormatted: string;
	href?: string; // destination for the action arrow
	onAction?: () => void; // fallback when href isn't provided
	onCardClick?: () => void; // click on the whole card
	isFavorite?: boolean;
	onFavoriteToggle?: (e?: React.MouseEvent) => void;
	className?: string;
};

export default function CatalogCard({
	imageSrc,
	imageAlt = "",
	tags = [],
	typeLabel,
	title,
	location,
	priceLabel = "MENSUALIDAD",
	price,
	href,
	onAction,
	onCardClick,
	isFavorite = false,
	onFavoriteToggle,
	priceFormatted,
	className = "",
}: CatalogCardProps) {
    const safeImageSrc = sanitizeImageSrc(imageSrc);

	return (
		<article
			onClick={onCardClick}
			className={`surface group overflow-hidden rounded-4xl bg-[#f9f4f2] transition-all duration-300 ${onCardClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : 'hover:-translate-y-0.5 hover:shadow-lg'} ${className}`}
		>
			{/* Media */}
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

				{/* Tag pills */}
				{tags?.length ? (
					<div className="pointer-events-none absolute left-4 top-4 flex flex-wrap gap-2">
						{tags.map((tag) => (
							<span
								key={tag}
								className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm"
							>
								{tag}
							</span>
						))}
					</div>
				) : null}

				{/* Favorite button */}
				<button
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

			{/* Info */}
			<div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-4 sm:pt-5">
				<p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-indigo-600">
					{typeLabel}
				</p>
				<h3 className="mt-2 text-base md:text-lg font-extrabold text-slate-900 transition-all duration-300 group-hover:text-indigo-600 group-hover:-translate-y-px">{title}</h3>

				<div className="mt-2 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
					<MapPin className="h-4 w-4" />
					<span>{location}</span>
				</div>

				<div className="my-4 sm:my-6 h-px w-full bg-slate-200" />

				<div className="flex items-center justify-between">
					<div>
						<p className="text-[10px] sm:text-[11px] font-extrabold tracking-widest text-slate-500">
							{priceLabel}
						</p>
						<p className="mt-2 text-base md:text-lg font-extrabold text-slate-900">
							{priceFormatted}
						</p>
					</div>

					{href ? (
						<Link
							href={href}
							className="grid h-10 w-10 md:h-11 md:w-11 place-items-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-indigo-700"
							aria-label="Ver detalle"
						>
							<ArrowRight className="h-5 w-5" />
						</Link>
					) : (
						<button
							onClick={onAction}
							className="grid h-10 w-10 md:h-11 md:w-11 place-items-center rounded-full bg-slate-900 text-white shadow-sm hover:bg-indigo-700"
							aria-label="Ver detalle"
						>
							<ArrowRight className="h-5 w-5" />
						</button>
					)}
				</div>
			</div>
		</article>
	);
}

