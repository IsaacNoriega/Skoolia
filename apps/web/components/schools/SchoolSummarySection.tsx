"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ChevronRight, Star, Users, Layers3 } from "lucide-react";

import { coursesService, type Course } from "@/lib/services/services/courses.service";
import { messagesService, type SchoolThread } from "@/lib/services/services/messages.service";
import { schoolsService, type School } from "@/lib/services/services/schools.service";

function formatRelativeDate(isoDate: string) {
	const date = new Date(isoDate);
	if (Number.isNaN(date.getTime())) return "";

	const diffMs = date.getTime() - Date.now();
	const formatter = new Intl.RelativeTimeFormat("es-MX", { numeric: "auto" });
	const minutes = Math.round(diffMs / (1000 * 60));
	const hours = Math.round(diffMs / (1000 * 60 * 60));
	const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

	if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
	if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
	return formatter.format(days, "day");
}

function formatSchoolLocation(school: School | null) {
	if (!school) return "Sin ubicación registrada";
	return school.city || school.address || "Sin ubicación registrada";
}

export default function SchoolSummarySection() {
	const [school, setSchool] = useState<School | null>(null);
	const [threads, setThreads] = useState<SchoolThread[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				setLoading(true);
				setError(null);

				const [schoolData, threadData, coursesData] = await Promise.all([
					schoolsService.getMySchool(),
					messagesService.listSchoolThreads(),
					coursesService.listMine(),
				]);

				if (!mounted) return;

				setSchool(schoolData);
				setThreads(threadData);
				setCourses(coursesData);
			} catch (err) {
				if (!mounted) return;

				console.error("No se pudo cargar el resumen escolar", err);
				setError("No se pudo cargar el resumen de tu escuela.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	const activeCourses = useMemo(
		() => courses.filter((course) => course.isActive && course.status !== "archived"),
		[courses],
	);

	const messagesToday = useMemo(() => {
		const today = new Date();
		return threads.filter((thread) => {
			const date = new Date(thread.lastMessageAt);
			return (
				date.getFullYear() === today.getFullYear() &&
				date.getMonth() === today.getMonth() &&
				date.getDate() === today.getDate()
			);
		}).length;
	}, [threads]);

	const pendingThreads = useMemo(
		() => threads.filter((thread) => thread.threadHasUnread).length,
		[threads],
	);

	const unreadMessages = useMemo(
		() => threads.reduce((sum, thread) => sum + thread.unreadCount, 0),
		[threads],
	);

	const cards = [
		{
			label: "Prospectos activos",
			value: String(threads.length),
			variation: unreadMessages
				? `${unreadMessages} mensajes sin leer`
				: pendingThreads
					? `${pendingThreads} conversaciones pendientes`
					: messagesToday
						? `${messagesToday} hoy`
						: "Sin mensajes hoy",
			icon: Users,
			accent: "bg-indigo-50 text-indigo-600",
		},
		{
			label: "Programas activos",
			value: String(activeCourses.length),
			variation: `${courses.length} registrados`,
			icon: Layers3,
			accent: "bg-emerald-50 text-emerald-600",
		},
		{
			label: "Calificación promedio",
			value: school ? school.averageRating.toFixed(1) : "0.0",
			variation: school ? `${school.ratingsCount} reseñas` : "Sin reseñas",
			icon: Star,
			accent: "bg-amber-50 text-amber-600",
		},
	];

	if (loading) {
		return (
			<div className="space-y-5 sm:space-y-6">
				<section className="surface rounded-4xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
					<p className="text-sm text-slate-500">Cargando resumen...</p>
				</section>
			</div>
		);
	}

	if (error) {
		return (
			<section className="surface rounded-4xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/5">
				<p className="text-sm text-rose-600">{error}</p>
			</section>
		);
	}

	return (
		<div className="space-y-5 sm:space-y-6">
			<section className="surface rounded-4xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/5 sm:px-6 sm:py-6">
				<div className="flex flex-wrap items-center gap-2 text-[10px] font-bold tracking-wide text-slate-500">
					<span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-amber-700">
						{school?.isVerified ? "ESCUELA VERIFICADA" : "ESCUELA REGISTRADA"}
					</span>
					<span className="text-slate-400">{formatSchoolLocation(school)}</span>
				</div>
				<h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
					{school?.name ?? "Mi escuela"}
				</h1>
				<p className="mt-3 max-w-3xl text-sm text-slate-600 sm:text-base">
					{school?.description || "Mantén el seguimiento de tus prospectos, mensajes y programas desde un solo lugar."}
				</p>
			</section>

			{/* MAPA DE LA ESCUELA */}
			{school?.lat && school?.lng && (
				<div className="my-6">
					<h3 className="text-lg font-semibold mb-2">Ubicación en el mapa</h3>
					<div className="w-full" style={{ minHeight: 320 }}>
						{/* @ts-expect-error Server Component import */}
						import SchoolsMap from "@/components/onboarding/SchoolsMap";
						<SchoolsMap
							schools={[{
								id: school.id,
								name: school.name,
								lat: school.lat,
								lng: school.lng,
								level: school.educationalLevel,
							}]} height={320}
						/>
					</div>
				</div>
			)}

			<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				{cards.map((card) => {
					const Icon = card.icon;
					return (
						<div
							key={card.label}
							className="surface flex flex-col justify-between rounded-4xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5 sm:px-6 sm:py-5"
						>
							<div className="flex items-center justify-between gap-2">
								<div>
									<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
										{card.label}
									</p>
									<p className="mt-2 text-2xl font-extrabold text-slate-900">
										{card.value}
									</p>
								</div>
								<div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.accent}`}>
									<Icon size={20} />
								</div>
							</div>
							<div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-slate-500">
								<span className="inline-flex items-center gap-1 text-emerald-600">
									<ArrowUpRight size={12} />
									{card.variation}
								</span>
								<span>Actualizado en tiempo real</span>
							</div>
						</div>
					);
				})}
			</section>

			<section className="surface overflow-hidden rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5">
				<div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
					<div>
						<h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
							Actividad reciente
						</h2>
						<p className="mt-1 text-xs text-slate-600 sm:text-sm">
							Últimos prospectos que interactuaron con tu institución.
						</p>
					</div>
				</div>

				<div className="divide-y divide-slate-100/70">
					{threads.slice(0, 5).map((thread) => {
						const initials = thread.publicUserName
							.split(" ")
							.map((part) => part[0])
							.join("")
							.slice(0, 2)
							.toUpperCase();

						return (
							<div
								key={thread.publicUserId}
								className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 sm:px-6 sm:py-5"
							>
								<div className="flex items-center gap-3 sm:gap-4">
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-700">
										{initials || "PF"}
									</div>
									<div>
										<p className="text-sm font-extrabold text-slate-900 sm:text-base">
											{thread.publicUserName}
										</p>
										<p className="text-xs text-slate-600 sm:text-sm">
											{thread.lastMessage}
										</p>
										<p className="mt-1 text-[10px] font-bold text-slate-400 sm:text-[11px]">
											{formatRelativeDate(thread.lastMessageAt)}
										</p>
									</div>
								</div>
								<span className={`inline-flex items-center rounded-xl px-3 py-1 text-[10px] font-bold sm:text-xs ${thread.threadHasUnread ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
									<span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${thread.threadHasUnread ? "bg-amber-500" : "bg-emerald-500"}`} />
									{thread.threadHasUnread ? `${thread.unreadCount} sin leer` : "Atendido"}
									<ChevronRight size={14} className="ml-1" />
								</span>
							</div>
						);
					})}

					{!threads.length ? (
						<div className="px-5 py-8 text-sm text-slate-500 sm:px-6">
							Aún no tienes interacciones recientes de familias interesadas.
						</div>
					) : null}
				</div>
			</section>
		</div>
	);
}