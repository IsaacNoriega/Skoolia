"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { X, Image as ImageIcon, Upload, MapPin, Globe, Loader2, Tag, Check, Calendar, Users, DollarSign, Layers, Plus, Trash2, Images } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { COURSE_MODALITIES } from "@/lib/constants";
import { MEXICO_STATES } from "@/lib/mexico-states";
import { geocodingService } from "@/lib/services/geocoding.service";
import { schoolCategoriesService, type Category } from "@/lib/services/services/schools-categories.service";

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
	categoryIds: string[];
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
		categoryIds?: string[];
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
		categoryIds: course?.categories?.map(c => c.id) ?? [],
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
	
	// Executive Colors
	const accentBg = "bg-indigo-600";
	const accentHoverBg = "hover:bg-indigo-700";
	const accentRing = "ring-indigo-500/20";
	const accentText = "text-indigo-600";

	const [form, setForm] = useState<CourseFormValues>(() => buildInitialValues(initialCourse));
	const [coverImage, setCoverImage] = useState<File | null>(null);
	const [galleryImages, setGalleryImages] = useState<File[]>([]);
	const [existingGallery, setExistingGallery] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [isGeocoding, setIsGeocoding] = useState(false);
	const [allCategories, setAllCategories] = useState<Category[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(false);

	useEffect(() => {
		if (isOpen) {
			setLoadingCategories(true);
			schoolCategoriesService.getAllCategories()
				.then(setAllCategories)
				.finally(() => setLoadingCategories(false));
		}
	}, [isOpen]);

	const previewUrl = useMemo(() => {
		if (coverImage) return URL.createObjectURL(coverImage);
		return initialCourse?.coverImageUrl ?? "";
	}, [coverImage, initialCourse?.coverImageUrl]);

	useEffect(() => {
		if (!isOpen) return;
		setForm(buildInitialValues(initialCourse));
		setCoverImage(null);
		setGalleryImages([]);
		setExistingGallery(initialCourse?.gallery || []);
		setError(null);
	}, [initialCourse, isOpen]);

	if (!isOpen) return null;

	const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget && !submitting) onClose();
	};

	const toggleCategory = (id: string) => {
		setForm(prev => ({
			...prev,
			categoryIds: prev.categoryIds.includes(id)
				? prev.categoryIds.filter(x => x !== id)
				: [...prev.categoryIds, id]
		}));
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
				state: form.state.trim() || undefined,
				onlineInstructions: form.onlineInstructions.trim() || undefined,
				latitude: form.latitude ? Number(form.latitude) : undefined,
				longitude: form.longitude ? Number(form.longitude) : undefined,
				coverImage,
				galleryImages,
				categoryIds: form.categoryIds,
				gallery: existingGallery,
			});
		} catch {
			setError("No se pudo guardar el programa. Inténtalo de nuevo.");
		}
	};

	return (
		<div
			className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm px-4"
			onClick={handleBackdropClick}
		>
			<motion.div 
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-slate-100 flex flex-col"
			>
				{/* 🏷️ HEADER */}
				<div className="px-10 pt-10 pb-6 border-b border-slate-50 flex justify-between items-start">
					<div>
						<div className="flex items-center gap-3 mb-2">
							<div className={`w-10 h-10 rounded-2xl ${accentBg} flex items-center justify-center text-white shadow-lg shadow-indigo-100`}>
								<Layers size={20} />
							</div>
							<h2 className="text-2xl font-black text-slate-950 tracking-tight">
								{mode === "create" ? "Agregar programa" : "Editar programa"}
							</h2>
						</div>
						<p className="text-sm font-medium text-slate-400">
							Define los detalles de tu oferta académica para atraer a más alumnos.
						</p>
					</div>
					<button
						onClick={onClose}
						disabled={submitting}
						className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-950 transition-all disabled:opacity-50"
					>
						<X size={20} />
					</button>
				</div>

				{/* 📝 FORM BODY */}
				<div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
					
					{/* 🔹 BASIC INFO SECTION */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="space-y-6 md:col-span-2">
							<Label icon={<Tag size={14}/>}>Nombre del Programa</Label>
							<input
								value={form.name}
								onChange={(e) => setForm(c => ({ ...c, name: e.target.value }))}
								placeholder="Ej. Primaria bilingüe"
								className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-bold text-slate-950 placeholder:text-slate-300"
							/>
						</div>

						<div className="space-y-6">
							<Label icon={<ImageIcon size={14}/>}>Imagen de Portada</Label>
							<div className="flex items-center gap-6 p-4 bg-slate-50 rounded-[2rem] border border-slate-100 ring-1 ring-white">
								<div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
									{previewUrl ? (
										<img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
									) : (
										<div className="flex h-full w-full items-center justify-center text-slate-200">
											<ImageIcon size={32} />
										</div>
									)}
								</div>
								<div className="flex flex-col gap-2">
									<label className="inline-flex h-11 items-center gap-2 rounded-xl bg-white border border-slate-100 px-5 text-xs font-black text-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer">
										<Upload size={14} className={accentText} />
										{coverImage ? "Cambiar foto" : "Cargar imagen"}
										<input type="file" accept="image/*" className="hidden" onChange={(e) => setCoverImage(e.target.files?.[0] ?? null)} />
									</label>
									<p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">JPG o PNG • 1200x800px</p>
								</div>
							</div>
						</div>

						{/* 🖼️ GALLERY SECTION */}
						<div className="md:col-span-2 space-y-6">
							<Label icon={<Images size={14}/>}>Galería del Programa (Máx. 6)</Label>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 ring-1 ring-white">
								{existingGallery.map((url, i) => (
									<div key={i} className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-slate-200 group">
										<img src={url} alt={`Gallery ${i}`} className="h-full w-full object-cover" />
										<button type="button" onClick={() => setExistingGallery(prev => prev.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rose-600/80 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest gap-2">
											<Trash2 size={12} /> Eliminar
										</button>
									</div>
								))}
								{galleryImages.map((file, i) => (
									<div key={`new-${i}`} className="relative aspect-video rounded-2xl overflow-hidden ring-1 ring-indigo-200 bg-white">
										<img src={URL.createObjectURL(file)} alt="New" className="h-full w-full object-cover opacity-60" />
										<button type="button" onClick={() => setGalleryImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 h-6 w-6 bg-white/90 rounded-full flex items-center justify-center text-rose-500 shadow-sm"><Trash2 size={12}/></button>
									</div>
								))}
								{existingGallery.length + galleryImages.length < 6 && (
									<label className="aspect-video rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-indigo-300 transition-all group">
										<input type="file" multiple accept="image/*" className="hidden" onChange={(e) => {
											const files = Array.from(e.target.files || []);
											setGalleryImages(prev => [...prev, ...files].slice(0, 6 - existingGallery.length));
										}} />
										<Plus size={20} className="text-slate-300 group-hover:text-indigo-400" />
										<span className="text-[8px] font-black uppercase text-slate-300 mt-2">Añadir foto</span>
									</label>
								)}
							</div>
						</div>

						<div className="space-y-6">
							<Label icon={<Layers size={14}/>}>Categorías</Label>
							<div className="p-4 bg-slate-50 rounded-[2rem] border border-slate-100 min-h-[110px]">
								{loadingCategories ? (
									<div className="flex items-center justify-center h-full">
										<Loader2 className="animate-spin text-slate-300" size={20} />
									</div>
								) : (
									<div className="flex flex-wrap gap-2">
										{allCategories.map(cat => (
											<button
												key={cat.id}
												onClick={() => toggleCategory(cat.id)}
												className={`h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border flex items-center gap-2 ${
													form.categoryIds.includes(cat.id)
														? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100'
														: 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
												}`}
											>
												{form.categoryIds.includes(cat.id) && <Check size={12} />}
												{cat.name}
											</button>
										))}
									</div>
								)}
							</div>
						</div>

						<div className="md:col-span-2 space-y-6">
							<Label icon={<Layers size={14}/>}>Descripción del Programa</Label>
							<textarea
								value={form.description}
								onChange={(e) => setForm(c => ({ ...c, description: e.target.value }))}
								rows={4}
								placeholder="Describe los beneficios, metodología y perfil de ingreso..."
								className="w-full p-6 rounded-[2rem] bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none"
							/>
						</div>
					</div>

					{/* 🔹 LOGISTICS SECTION */}
					<div className="space-y-8">
						<div className="flex items-center gap-4">
							<span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Logística y Costos</span>
							<div className="h-px flex-1 bg-slate-50" />
						</div>

						<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
							<div className="space-y-4">
								<Label icon={<DollarSign size={14}/>}>Precio (MXN)</Label>
								<input
									type="number"
									value={form.price}
									onChange={(e) => setForm(c => ({ ...c, price: e.target.value }))}
									placeholder="0"
									className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-black"
								/>
							</div>
							<div className="space-y-4">
								<Label icon={<Users size={14}/>}>Capacidad</Label>
								<input
									type="number"
									value={form.capacity}
									onChange={(e) => setForm(c => ({ ...c, capacity: e.target.value }))}
									placeholder="30"
									className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-black"
								/>
							</div>
							<div className="space-y-4">
								<Label icon={<Globe size={14}/>}>Modalidad</Label>
								<select
									value={form.modality}
									onChange={(e) => setForm(c => ({ ...c, modality: e.target.value }))}
									className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-black"
								>
									<option value="">Seleccionar</option>
									{COURSE_MODALITIES.map(m => <option key={m} value={m}>{m}</option>)}
								</select>
							</div>
							<div className="space-y-4">
								<Label icon={<Check size={14}/>}>Estado</Label>
								<select
									value={form.status}
									onChange={(e) => setForm(c => ({ ...c, status: e.target.value as any }))}
									className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all text-sm font-black"
								>
									<option value="draft">Borrador</option>
									<option value="published">Publicado</option>
									<option value="archived">Archivado</option>
								</select>
							</div>
						</div>
					</div>

					{/* 🔹 DATES & LOCATION */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						<div className="space-y-6">
							<Label icon={<Calendar size={14}/>}>Fechas del Programa</Label>
							<div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 ring-1 ring-white">
								<div className="space-y-2">
									<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inicio</p>
									<input
										type="date"
										value={form.startDate}
										onChange={(e) => setForm(c => ({ ...c, startDate: e.target.value }))}
										className="w-full h-11 bg-white rounded-xl px-4 text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
									/>
								</div>
								<div className="space-y-2">
									<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin</p>
									<input
										type="date"
										value={form.endDate}
										onChange={(e) => setForm(c => ({ ...c, endDate: e.target.value }))}
										className="w-full h-11 bg-white rounded-xl px-4 text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
									/>
								</div>
							</div>
						</div>

						<div className="space-y-6">
							<Label icon={<MapPin size={14}/>}>Ubicación</Label>
							<div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 ring-1 ring-white space-y-4">
								{(form.modality === "Presencial" || form.modality === "Híbrido") ? (
									<>
										<div className="flex gap-2">
											<input
												value={form.address}
												onChange={(e) => setForm(c => ({ ...c, address: e.target.value }))}
												placeholder="Calle, número, colonia..."
												className="flex-1 h-11 bg-white rounded-xl px-4 text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
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
												className={`h-11 px-4 rounded-xl ${accentBg} text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 flex items-center gap-2`}
											>
												{isGeocoding ? <Loader2 className="animate-spin" size={14} /> : <MapPin size={14} />}
												Map
											</button>
										</div>
										<select
											value={form.city}
											onChange={(e) => setForm(c => ({ ...c, city: e.target.value }))}
											className="w-full h-11 bg-white rounded-xl px-4 text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
										>
											<option value="">Seleccionar Estado</option>
											{MEXICO_STATES.map(s => <option key={s} value={s}>{s}</option>)}
										</select>
									</>
								) : (
									<div className="space-y-2">
										<p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instrucciones / Link Online</p>
										<input
											value={form.onlineInstructions}
											onChange={(e) => setForm(c => ({ ...c, onlineInstructions: e.target.value }))}
											placeholder="Zoom link, plataforma, etc..."
											className="w-full h-11 bg-white rounded-xl px-4 text-xs font-bold border border-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none"
										/>
									</div>
								)}
							</div>
						</div>
					</div>

					{error && (
						<motion.div 
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-bold text-rose-600 flex items-center gap-3"
						>
							<div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
							{error}
						</motion.div>
					)}
				</div>

				{/* 🏷️ FOOTER */}
				<div className="px-10 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
					<label className="flex items-center gap-3 cursor-pointer group">
						<div className={`w-10 h-6 rounded-full p-1 transition-all ${form.isActive ? accentBg : 'bg-slate-200'}`}>
							<motion.div 
								animate={{ x: form.isActive ? 16 : 0 }}
								className="w-4 h-4 rounded-full bg-white shadow-sm"
							/>
						</div>
						<input type="checkbox" className="hidden" checked={form.isActive} onChange={e => setForm(c => ({ ...c, isActive: e.target.checked }))} />
						<span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">Visible al Público</span>
					</label>

					<div className="flex items-center gap-4">
						<button
							type="button"
							onClick={onClose}
							disabled={submitting}
							className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all disabled:opacity-50"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={() => void handleSubmit()}
							disabled={submitting}
							className={`h-12 px-8 rounded-2xl ${accentBg} text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3`}
						>
							{submitting ? <Loader2 className="animate-spin" size={14} /> : (mode === "create" ? "Crear Programa" : "Guardar Cambios")}
						</button>
					</div>
				</div>
			</motion.div>
		</div>
	);
}

function Label({ children, icon }: { children: React.ReactNode, icon?: React.ReactNode }) {
	return (
		<div className="flex items-center gap-2 mb-2">
			<span className="text-indigo-600 opacity-40">{icon}</span>
			<label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
				{children}
			</label>
		</div>
	);
}