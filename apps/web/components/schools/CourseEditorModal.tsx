"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { X, Image as ImageIcon, Upload, MapPin, Globe, Loader2 } from "lucide-react";
import { COURSE_MODALITIES } from "@/lib/constants";
import { MEXICO_STATES } from "@/lib/mexico-states";
import { geocodingService } from "@/lib/services/geocoding.service";

import type { Course } from "@/lib/services/services/courses.service";

type CourseFormValues = {
	name: string;
	description: string;
	price: string;
	capacity: string;
	modality: string;
	startDate: string;
	endDate: string;
	status: Course["status"];
	isActive: boolean;
	address: string;
	city: string;
	state: string;
	onlineInstructions: string;
	latitude: string;
	longitude: string;
};

type Props = {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: {
		name: string;
		description?: string;
		price: number;
		capacity?: number;
		modality?: string;
		startDate?: string;
		endDate?: string;
		status: Course["status"];
		isActive: boolean;
		coverImage?: File | null;
		galleryImages?: File[];
		address?: string;
		city?: string;
		state?: string;
		onlineInstructions?: string;
		latitude?: number;
		longitude?: number;
	}) => Promise<void>;
	mode: "create" | "edit";
	initialCourse?: Course | null;
	submitting: boolean;
};

function toDateInput(value?: string | null) {
	if (!value) return "";
	return value.slice(0, 10);
}

function buildInitialValues(course?: Course | null): CourseFormValues {
	return {
		name: course?.name ?? "",
		description: course?.description ?? "",
		price: course ? String(course.price) : "",
		capacity: course?.capacity ? String(course.capacity) : "",
		modality: course?.modality ?? "",
		startDate: toDateInput(course?.startDate),
		endDate: toDateInput(course?.endDate),
		status: course?.status ?? "draft",
		isActive: course?.isActive ?? true,
		address: course?.address ?? "",
		city: course?.city ?? "",
		state: course?.state ?? "",
		onlineInstructions: course?.onlineInstructions ?? "",
		latitude: course?.latitude ? String(course.latitude) : "",
		longitude: course?.longitude ? String(course.longitude) : "",
	};
}

export default function CourseEditorModal({
	isOpen,
	onClose,
	onSubmit,
	mode,
	initialCourse,
	submitting,
}: Props) {
	const pathname = usePathname();
	const isCourseMode = pathname.startsWith("/courses");
	const accentColorClass = isCourseMode ? "ring-violet-500" : "ring-indigo-500";
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
	const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-indigo-600";

	const [form, setForm] = useState<CourseFormValues>(() => buildInitialValues(initialCourse));
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [galleryImages, setGalleryImages] = useState<File[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isGeocoding, setIsGeocoding] = useState(false);

	const previewUrl = useMemo(() => {
		if (coverImage) return URL.createObjectURL(coverImage);
		return initialCourse?.coverImageUrl ?? "";
	}, [coverImage, initialCourse?.coverImageUrl]);

	useEffect(() => {
		if (!isOpen) return;
		setForm(buildInitialValues(initialCourse));
		setCoverImage(null);
		setGalleryImages([]);
		setError(null);
	}, [initialCourse, isOpen]);

	if (!isOpen) return null;

	const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget && !submitting) onClose();
	};

	const handleSubmit = async () => {
		if (!form.name.trim()) {
			setError("El nombre del programa es obligatorio.");
			return;
		}

		const price = Number(form.price);
		if (Number.isNaN(price) || price <= 0) {
			setError("Ingresa un precio mayor a 0.");
			return;
		}

		const capacity = form.capacity === "" ? undefined : Number(form.capacity);
		if (capacity !== undefined && (Number.isNaN(capacity) || capacity <= 0)) {
			setError("Ingresa una capacidad mayor a 0.");
			return;
		}

		if ((form.modality === "Presencial" || form.modality === "Híbrido") && (!form.address.trim() || !form.city.trim())) {
			setError("La dirección y el estado son obligatorios para esta modalidad.");
			return;
		}

		setError(null);

		try {
			await onSubmit({
				name: form.name.trim(),
				description: form.description.trim() || undefined,
				price,
				capacity,
				modality: form.modality.trim() || undefined,
				startDate: form.startDate || undefined,
				endDate: form.endDate || undefined,
				status: form.status,
				isActive: form.isActive,
				address: form.address.trim() || undefined,
				city: form.city.trim() || undefined,
				state: form.city.trim() || undefined, // Mapeado a ciudad por ahora
				onlineInstructions: form.onlineInstructions.trim() || undefined,
				latitude: form.latitude ? Number(form.latitude) : undefined,
				longitude: form.longitude ? Number(form.longitude) : undefined,
				coverImage,
				galleryImages,
			});
		} catch {
			setError("No se pudo guardar el programa. Inténtalo de nuevo.");
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
			onClick={handleBackdropClick}
			aria-modal
			role="dialog"
		>
			<div className="relative w-full max-w-3xl rounded-3xl bg-white shadow-2xl">
				<button
					onClick={onClose}
					aria-label="Cerrar"
					disabled={submitting}
					className="absolute right-5 top-5 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
				>
					<X size={18} />
				</button>

				<div className="px-8 pt-8 pb-6">
					<div>
						<h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
							{mode === "create" ? "Agregar programa" : "Editar programa"}
						</h2>
						<p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
							Configura la información clave de tu oferta académica.
						</p>
					</div>

					<div className="mt-8 grid gap-4 sm:grid-cols-2">
						<div className="sm:col-span-2">
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Nombre del programa
							</label>
							<input
								value={form.name}
								onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
								placeholder="Ej. Primaria bilingüe"
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<div className="sm:col-span-2">
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Imagen de portada
							</label>
							<div className="flex flex-wrap items-center gap-4">
								<div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-slate-100 ring-1 ring-slate-200">
									{previewUrl ? (
										// eslint-disable-next-line @next/next/no-img-element
										<img
											src={previewUrl}
											alt="Vista previa"
											className="h-full w-full object-cover"
										/>
									) : (
										<div className="flex h-full w-full items-center justify-center text-slate-300">
											<ImageIcon size={24} />
										</div>
									)}
								</div>
								<div className="flex-1 space-y-2">
									<label className={`inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 cursor-pointer`}>
										<Upload size={14} />
										{coverImage ? "Cambiar foto" : "Subir foto"}
										<input
											type="file"
											accept="image/*"
											className="hidden"
											onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)}
										/>
									</label>
									<p className="text-[10px] text-slate-400 leading-normal">
										{coverImage ? `Seleccionado: ${coverImage.name}` : "Recomendado: JPG o PNG de 1200x800px."}
									</p>
								</div>
							</div>
						</div>

						<div className="sm:col-span-2">
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Descripción
							</label>
							<textarea
								value={form.description}
								onChange={(event) =>
									setForm((current) => ({ ...current, description: event.target.value }))
								}
								rows={4}
								placeholder="Describe el programa, beneficios y perfil de ingreso."
								className={`w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<div className="sm:col-span-2">
							<label className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Galería del programa
							</label>
							<div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
								{initialCourse?.gallery?.map((url, i) => (
									<div key={i} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-slate-100 group">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={url} alt="Gallery" className="h-full w-full object-cover" />
									</div>
								))}
								{galleryImages.map((file, i) => (
									<div key={`new-${i}`} className="relative aspect-square rounded-xl overflow-hidden ring-1 ring-slate-200 bg-slate-50">
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img src={URL.createObjectURL(file)} alt="Preview" className="h-full w-full object-cover opacity-50" />
									</div>
								))}
								{((initialCourse?.gallery?.length || 0) + galleryImages.length) < 6 && (
									<label className="aspect-square rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
										<input 
											type="file" 
											multiple 
											accept="image/*" 
											className="hidden" 
											onChange={(e) => {
												const files = Array.from(e.target.files || []);
												setGalleryImages(prev => [...prev, ...files].slice(0, 5 - (initialCourse?.gallery?.length || 0)));
											}}
										/>
										<span className="text-xl text-slate-300 font-light">+</span>
									</label>
								)}
							</div>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Precio
							</label>
							<input
								type="number"
								min="0"
								value={form.price}
								onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
								placeholder="0"
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Capacidad
							</label>
							<input
								type="number"
								min="0"
								value={form.capacity}
								onChange={(event) => setForm((current) => ({ ...current, capacity: event.target.value }))}
								placeholder="30"
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Modalidad
							</label>
							<select
								value={form.modality}
								onChange={(event) => setForm((current) => ({ ...current, modality: event.target.value }))}
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							>
								<option value="">Seleccionar modalidad</option>
								{COURSE_MODALITIES.map(m => (
									<option key={m} value={m}>{m}</option>
								))}
							</select>
						</div>

						{/* Sección Online */}
						{form.modality === "En línea" && (
							<div className="sm:col-span-2">
								<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
									<Globe size={14} /> Instrucciones o Link
								</label>
								<input
									value={form.onlineInstructions}
									onChange={(event) => setForm((current) => ({ ...current, onlineInstructions: event.target.value }))}
									placeholder="Ej. Link de Zoom, instrucciones de contacto..."
									className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
								/>
							</div>
						)}

						{/* Sección Presencial/Híbrido */}
						{(form.modality === "Presencial" || form.modality === "Híbrido") && (
							<>
								<div className="sm:col-span-2">
									<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-2">
										<MapPin size={14} /> Dirección
									</label>
									<div className="flex gap-2">
										<input
											value={form.address}
											onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
											placeholder="Calle, número, colonia..."
											className={`h-11 flex-1 rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
										/>
										<button
											type="button"
											disabled={isGeocoding || !form.city}
											onClick={async () => {
												setIsGeocoding(true);
												const res = await geocodingService.geocodeAddressWithFallback(form.address, form.city);
												setIsGeocoding(false);
												if (res.success && res.data) {
													setForm(c => ({ ...c, latitude: String(res.data.lat), longitude: String(res.data.lng) }));
												}
											}}
											className={`h-11 px-4 rounded-2xl ${accentBgClass} text-white text-xs font-bold disabled:opacity-50 flex items-center gap-2`}
										>
											{isGeocoding ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
											Geolocalizar
										</button>
									</div>
								</div>
								<div>
									<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
										Estado
									</label>
									<select
										value={form.city}
										onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
										className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
									>
										<option value="">Seleccionar estado</option>
										{MEXICO_STATES.map(s => (
											<option key={s} value={s}>{s}</option>
										))}
									</select>
								</div>
							</>
						)}

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Estado
							</label>
							<select
								value={form.status}
								onChange={(event) =>
									setForm((current) => ({
										...current,
										status: event.target.value as Course["status"],
									}))
								}
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							>
								<option value="draft">Borrador</option>
								<option value="published">Publicado</option>
								<option value="archived">Archivado</option>
							</select>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Inicio
							</label>
							<input
								type="date"
								value={form.startDate}
								onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))}
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<div>
							<label className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-slate-400">
								Fin
							</label>
							<input
								type="date"
								value={form.endDate}
								onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
								className={`h-11 w-full rounded-2xl bg-slate-50 px-4 text-sm text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 ${accentColorClass}`}
							/>
						</div>

						<label className="inline-flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200 sm:col-span-2">
							<input
								type="checkbox"
								checked={form.isActive}
								onChange={(event) =>
									setForm((current) => ({ ...current, isActive: event.target.checked }))
								}
								className={`h-4 w-4 rounded border-slate-300 ${isCourseMode ? "text-violet-600" : "text-indigo-600"}`}
							/>
							Activo y visible en la operación diaria
						</label>
					</div>

					{error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

					<div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-4">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="text-xs font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 sm:text-sm"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={() => void handleSubmit()}
							disabled={submitting}
							className={`inline-flex items-center rounded-2xl ${accentBgClass} px-5 py-2 text-xs font-bold text-white shadow ${accentHoverBgClass} disabled:opacity-50 sm:text-sm`}
						>
							{submitting ? "Guardando..." : mode === "create" ? "Crear programa" : "Guardar cambios"}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}