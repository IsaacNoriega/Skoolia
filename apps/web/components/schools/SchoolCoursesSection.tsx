"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Pencil, Plus, Trash2, Image as ImageIcon } from "lucide-react";

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
	}) => {
		try {
			setSubmitting(true);

			let coverImageUrl = selectedCourse?.coverImageUrl || undefined;

			if (values.coverImage) {
				const uploaded = await filesService.upload(values.coverImage);
				coverImageUrl = uploaded.url;
			}

			let gallery: string[] = selectedCourse?.gallery || [];
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
		return { active, published, total: courses.length };
	}, [courses]);

	return (
		<>
			<section className="rounded-[2rem] border border-slate-200 bg-white">
				<div className="border-b border-slate-200 p-6 sm:p-8">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
								Oferta académica
							</p>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
								Programas visibles.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
								Gestiona tus cursos con una vista simple: nombre, modalidad, precio y estado.
							</p>
						</div>

						<button
							type="button"
							onClick={openCreateModal}
							className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
						>
							<Plus size={16} />
							Agregar programa
						</button>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						<Metric label="Total" value={`${stats.total}`} />
						<Metric label="Activos" value={`${stats.active}`} accent accentClass={accentTextClass} />
						<Metric label="Publicados" value={`${stats.published}`} />
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
						<div className="space-y-3">
							{courses.map((course) => (
								<div
									key={course.id}
									className="rounded-[1.5rem] border border-slate-200 px-4 py-4 transition hover:border-slate-300"
								>
									<div className="flex items-start gap-4">
										{/* Miniatura de imagen */}
										<div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100 ring-1 ring-slate-100 sm:h-20 sm:w-20">
											{course.coverImageUrl ? (
												// eslint-disable-next-line @next/next/no-img-element
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
											<div className="flex items-center gap-2">
												<span className={`h-2 w-2 rounded-full ${statusDot(course.status, course.isActive, accentColorClass)}`} />
												<span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
													{statusLabel(course.status)}
												</span>
											</div>

											<p className="mt-3 truncate text-sm font-semibold text-slate-950 sm:text-base">
												{course.name}
											</p>

											<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
												<span>{course.modality || "Modalidad por definir"}</span>
												<span className="h-1 w-1 rounded-full bg-slate-300" />
												<span>{formatCurrency(course.price)}</span>
												<span className="h-1 w-1 rounded-full bg-slate-300" />
												<span>{course.capacity ? `${course.capacity} cupos` : "Cupos abiertos"}</span>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() => openEditModal(course)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
												aria-label="Editar programa"
											>
												<Pencil size={14} />
											</button>
											<button
												type="button"
												onClick={() => void handleDelete(course)}
												disabled={submitting}
												className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950 disabled:opacity-50"
												aria-label="Eliminar programa"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>

									<div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
										<span className="text-xs font-medium text-slate-400">
											{course.isActive ? "Visible para familias" : "No visible"}
										</span>
										<span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-950">
											Ver detalle
											<ArrowUpRight size={16} />
										</span>
									</div>
								</div>
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
