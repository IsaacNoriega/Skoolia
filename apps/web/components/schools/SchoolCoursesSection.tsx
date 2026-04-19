"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { useToast } from "@/components/ui/toast";
import CourseEditorModal from "./CourseEditorModal";
import { useAuth } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnBoardingContext";

export default function SchoolCoursesSection() {
	const { user } = useAuth();
	const { state: onboarding } = useOnboarding();
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
		if (!window.confirm(`¿Eliminar el programa \"${course.name}\"?`)) return;

		try {
			setSubmitting(true);
			await coursesService.delete(course.id);
			await loadCourses();
			showToast({
				title: "Oferta eliminada",
				description: `\"${course.name}\" ya no aparece en tu oferta académica.`,
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
	}) => {
		try {
			setSubmitting(true);
			if (modalMode === "create") {
				await coursesService.create({
					name: values.name,
					description: values.description,
					price: values.price,
					capacity: values.capacity,
					modality: values.modality,
					startDate: values.startDate,
					endDate: values.endDate,
				});
				showToast({
					title: "Oferta creada",
					description: "La oferta académica se guardó en la base de datos.",
					variant: "success",
				});
			} else if (selectedCourse) {
				await coursesService.update(selectedCourse.id, values);
				showToast({
					title: "Oferta actualizada",
					description: `Los cambios en \"${selectedCourse.name}\" ya quedaron guardados.`,
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

	return (
		<>
		<section className="surface rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
			<header className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
				<div>
					<h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
						Oferta académica
					</h2>
					<p className="mt-1 text-xs sm:text-sm text-slate-600">
						Administra tus programas, modalidades y cupos publicados.
					</p>
				</div>
				{onboarding?.data?.tipoRegistro !== "escuela" && (
					<button
						type="button"
						onClick={openCreateModal}
						className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-indigo-700"
					>
						<span className="text-base leading-none">+</span>
						<span>Agregar programa</span>
					</button>
				)}
			</header>

			<div className="divide-y divide-slate-100/70">
				{loading ? (
					<div className="px-5 py-4 text-sm text-slate-500 sm:px-6 sm:py-5">
						Cargando programas...
					</div>
				) : null}

				{error ? (
					<div className="px-5 py-4 text-sm text-rose-600 sm:px-6 sm:py-5">
						{error}
					</div>
				) : null}

				{courses.map((course) => (
					<div
						key={course.id}
						className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 hover:bg-slate-50"
					>
						<div className="flex items-center gap-4 sm:gap-5">
							<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-xs font-bold text-slate-400">
								{course.name.slice(0, 2).toUpperCase()}
							</div>
							<div>
								<p className="text-sm sm:text-base font-extrabold text-slate-900">
									{course.name}
								</p>
								<p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-400">
									<span>{course.modality || "SIN MODALIDAD"}</span>
									<span className="h-1 w-1 rounded-full bg-slate-300" />
									<span className="text-indigo-600">
										{course.capacity ? `${course.capacity} cupos` : "Cupos abiertos"}
									</span>
									<span className="h-1 w-1 rounded-full bg-slate-300" />
									<span>{course.status.toUpperCase()}</span>
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2 sm:gap-3">
							<button
								type="button"
								onClick={() => openEditModal(course)}
								className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
							>
								<Pencil size={16} />
							</button>
							<button
								type="button"
								onClick={() => void handleDelete(course)}
								disabled={submitting}
								className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
							>
								<Trash2 size={16} />
							</button>
							<button className="hidden sm:inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:bg-slate-50">
								<MoreHorizontal size={16} />
							</button>
						</div>
					</div>
				))}

				{!loading && !error && !courses.length ? (
					<div className="px-5 py-8 text-sm text-slate-500 sm:px-6">
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
