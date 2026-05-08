"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Eye, Pencil, Plus, Sparkles, Trash2, Image as ImageIcon } from "lucide-react";

import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { filesService } from "@/lib/services/services/files.service";
import { useToast } from "@/components/ui/toast";
import CourseEditorModal from "./CourseEditorModal";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency: "MXN",
		maximumFractionDigits: 0,
	}).format(value);
}

function statusLabel(status: Course["status"]) {
	switch (status) {
		case "published":
			return "Publicado";
		case "archived":
			return "Archivado";
		case "draft":
		default:
			return "Borrador";
	}
}

function statusDot(status: Course["status"], isActive: boolean, accentColor: string) {
	if (!isActive || status === "archived") return "bg-slate-300";
	if (status === "published") return accentColor;
	return "bg-slate-950";
}

export default function SchoolCoursesSection() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { showToast } = useToast();
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [modalMode, setModalMode] = useState<"create" | "edit">("create");
	const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const isCourseMode = pathname.startsWith("/courses");
	const accentColorClass = isCourseMode ? "bg-violet-600" : "bg-[#1973fd]";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-[#1973fd]";


	const loadCourses = async () => {
		setLoading(true);
		setError(null);
		try {
			const data = await coursesService.listMine();
			setCourses(data);
		} catch (err) {
			console.error("No se pudieron cargar los cursos", err);
			setError("No se pudo cargar la oferta académica.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				const data = await coursesService.listMine();
				if (mounted) setCourses(data);
			} catch (err) {
				if (!mounted) return;
				console.error("No se pudieron cargar los cursos", err);
				setError("No se pudo cargar la oferta académica.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	const openCreateModal = () => {
		setModalMode("create");
		setSelectedCourse(null);
		setIsModalOpen(true);
	};

	useEffect(() => {
		if (searchParams.get("create") !== "1") return;
		openCreateModal();
	}, [searchParams]);

	const openEditModal = (course: Course) => {
		setModalMode("edit");
		setSelectedCourse(course);
		setIsModalOpen(true);
	};

	const handleDelete = async (course: Course) => {
		if (!window.confirm(`¿Eliminar el programa "${course.name}"?`)) return;

		try {
			setSubmitting(true);
			await coursesService.delete(course.id);
			await loadCourses();
			showToast({
				title: "Oferta eliminada",
				description: `"${course.name}" ya no aparece en tu oferta académica.`,
				variant: "success",
			});
		} catch (err) {
			console.error("No se pudo eliminar el programa", err);
			setError("No se pudo eliminar el programa.");
			showToast({
				title: "No se pudo eliminar la oferta",
				description: "Inténtalo de nuevo en unos segundos.",
				variant: "error",
			});
		} finally {
			setSubmitting(false);
		}
	};

	const handleSubmit = async (values: {
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
		categoryIds?: string[];
		gallery?: string[];
	}) => {
		try {
			setSubmitting(true);

			let coverImageUrl = selectedCourse?.coverImageUrl || undefined;

			if (values.coverImage) {
				const uploaded = await filesService.upload(values.coverImage);
				coverImageUrl = uploaded.url;
			}

			let gallery: string[] = values.gallery || selectedCourse?.gallery || [];
			if (values.galleryImages && values.galleryImages.length > 0) {
				const uploadedGallery = await Promise.all(values.galleryImages.map(f => filesService.upload(f)));
				gallery = [...gallery, ...uploadedGallery.map(f => f.url)];
			}

			if (modalMode === "create") {
				await coursesService.create({
					name: values.name,
					description: values.description,
					price: values.price,
					capacity: values.capacity,
					modality: values.modality,
					startDate: values.startDate,
					endDate: values.endDate,
					coverImageUrl,
					gallery,
					categoryIds: values.categoryIds,
				});
				showToast({
					title: "Oferta creada",
					description: "La oferta académica se guardó en la base de datos.",
					variant: "success",
				});
			} else if (selectedCourse) {
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { coverImage, galleryImages, ...updatePayload } = values;
				await coursesService.update(selectedCourse.id, {
					...updatePayload,
					coverImageUrl,
					gallery,
					categoryIds: values.categoryIds,
				});
				showToast({
					title: "Oferta actualizada",
					description: `Los cambios en "${selectedCourse.name}" ya quedaron guardados.`,
					variant: "success",
				});
			}

			setIsModalOpen(false);
			setSelectedCourse(null);
			if (searchParams.get("create") === "1") {
				router.replace(pathname);
			}
			await loadCourses();
		} catch (err) {
			console.error("No se pudo guardar el programa", err);
			showToast({
				title: "No se pudo guardar la oferta",
				description: "Revisa los datos e inténtalo de nuevo.",
				variant: "error",
			});
			throw err;
		} finally {
			setSubmitting(false);
		}
	};

	const stats = useMemo(() => {
		const active = courses.filter((course) => course.isActive).length;
		const published = courses.filter((course) => course.status === "published").length;
		const drafts = courses.filter((course) => course.status === "draft").length;
		return { active, published, drafts, total: courses.length };
	}, [courses]);

	return (
		<>
			<section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
				<div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(25,115,253,0.12),_transparent_45%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 sm:p-8">
					<div className="flex flex-wrap items-start justify-between gap-5">
						<div className="max-w-3xl">
							<p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
								Oferta académica
							</p>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
								Cursos más claros, acciones más rápidas.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
								Controla estado, precio, capacidad y visibilidad desde una vista más compacta. También puedes
								previsualizar la ficha pública sin salir del panel.
							</p>
						</div>

						<div className="flex flex-wrap gap-3">
							<button
								type="button"
								onClick={openCreateModal}
								className="inline-flex h-11 items-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
							>
								<Plus size={16} />
								Nuevo programa
							</button>
							<button
								type="button"
								onClick={() => router.push(isCourseMode ? "/courses/settings" : "/schools/settings")}
								className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
							>
								<Sparkles size={16} />
								Mejorar perfil
							</button>
						</div>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
						<Metric label="Total" value={`${stats.total}`} />
						<Metric label="Activos" value={`${stats.active}`} accent accentClass={accentTextClass} />
						<Metric label="Publicados" value={`${stats.published}`} />
						<Metric label="Borradores" value={`${stats.drafts}`} />
					</div>
				</div>

				<div className="p-6 sm:p-8">
					{loading ? (
						<div className="text-sm text-slate-500">Cargando programas...</div>
					) : null}

					{error ? (
						<div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">
							{error}
						</div>
					) : null}

					{!loading && !error && courses.length ? (
						<div className="grid gap-4 xl:grid-cols-2">
							{courses.map((course) => (
								<article
									key={course.id}
									className="rounded-[1.75rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_60px_-45px_rgba(15,23,42,0.45)]"
								>
									<div className="flex items-start gap-4">
										<div className="h-18 w-18 shrink-0 overflow-hidden rounded-[1.25rem] bg-slate-100 ring-1 ring-slate-100 sm:h-22 sm:w-22">
											{course.coverImageUrl ? (
												<img
													src={course.coverImageUrl}
													alt={course.name}
													className="h-full w-full object-cover"
												/>
											) : (
												<div className="flex h-full w-full items-center justify-center text-slate-300">
													<ImageIcon size={20} />
												</div>
											)}
										</div>

										<div className="min-w-0 flex-1">
											<div className="flex flex-wrap items-center gap-2">
												<span className={`h-2 w-2 rounded-full ${statusDot(course.status, course.isActive, accentColorClass)}`} />
												<span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
													{statusLabel(course.status)}
												</span>
												<span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
													{course.modality || "Modalidad pendiente"}
												</span>
												{course.categories?.map(cat => (
													<span key={cat.id} className="rounded-full bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-indigo-600">
														{cat.name}
													</span>
												))}
											</div>

											<p className="mt-3 text-lg font-semibold text-slate-950">
												{course.name}
											</p>

											<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
												<span>{formatCurrency(course.price)}</span>
												<span className="h-1 w-1 rounded-full bg-slate-300" />
												<span>{course.capacity ? `${course.capacity} cupos` : "Cupos abiertos"}</span>
											</div>

											<p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
												{course.description?.trim() || "Agrega una descripción breve para que la oferta pública se entienda mejor."}
											</p>
										</div>
									</div>

									<div className="mt-5 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
										<span className="text-xs font-medium text-slate-400">
											{course.isActive ? "Visible para familias" : "No visible"}
										</span>
										<div className="flex flex-wrap justify-end gap-2">
											<button
												type="button"
												onClick={() => router.push(`/search/course/${course.id}`)}
												className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
											>
												<Eye size={15} />
												Previsualizar
											</button>
											<button
												type="button"
												onClick={() => openEditModal(course)}
												className="inline-flex h-10 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
											>
												<Pencil size={15} />
												Editar
											</button>
											<button
												type="button"
												onClick={() => void handleDelete(course)}
												disabled={submitting}
												className="inline-flex h-10 items-center gap-2 rounded-2xl border border-rose-200 px-4 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
											>
												<Trash2 size={15} />
												Eliminar
											</button>
										</div>
									</div>
								</article>
							))}
						</div>
					) : null}

					{!loading && !error && !courses.length ? (
						<div className="rounded-[1.5rem] border border-dashed border-slate-200 px-5 py-10 text-sm text-slate-500">
							Todavía no tienes programas registrados.
						</div>
					) : null}
				</div>
			</section>

			<CourseEditorModal
				isOpen={isModalOpen}
				onClose={() => {
					if (submitting) return;
					setIsModalOpen(false);
					setSelectedCourse(null);
					if (searchParams.get("create") === "1") {
						router.replace(pathname);
					}
				}}
				onSubmit={handleSubmit}
				mode={modalMode}
				initialCourse={selectedCourse}
				submitting={submitting}
			/>
		</>
	);
}

function Metric({
	label,
	value,
	accent = false,
	accentClass = "text-[#1973fd]",
}: {
	label: string;
	value: string;
	accent?: boolean;
	accentClass?: string;
}) {
	return (
		<div className="rounded-2xl bg-slate-50 px-4 py-4">
			<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
				{label}
			</p>
			<p className={`mt-3 text-2xl font-semibold ${accent ? accentClass : "text-slate-950"}`}>
				{value}
			</p>
		</div>
	);
}
