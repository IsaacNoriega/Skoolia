"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	ArrowRight,
	BookOpen,
	CalendarDays,
	CheckCircle2,
	Clock3,
	CreditCard,
	Globe2,
	GraduationCap,
	Layers3,
	Loader2,
	MapPin,
	MessageCircle,
	Play,
	Send,
	ShieldCheck,
	Sparkles,
	Star,
	Users,
	Wifi,
	type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { coursesService, type Course } from "@/lib/services/services/courses.service";
import {
	messagesService,
	type SchoolThread,
} from "@/lib/services/services/messages.service";
import { schoolsService, type School } from "@/lib/services/services/schools.service";
import {
	subscriptionsService,
	type SchoolActivePlan,
} from "@/lib/services/services/subscriptions.service";

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

function formatCurrency(value: number | null | undefined) {
	if (value == null) return "No definido";

	return new Intl.NumberFormat("es-MX", {
		style: "currency",
		currency: "MXN",
		maximumFractionDigits: 0,
	}).format(value);
}

function formatShortDate(value: string | null | undefined) {
	if (!value) return "Sin fecha";
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return "Sin fecha";

	return new Intl.DateTimeFormat("es-MX", {
		day: "numeric",
		month: "short",
		year: "numeric",
	}).format(date);
}

export default function SchoolSummarySection() {
	const [school, setSchool] = useState<School | null>(null);
	const [activePlan, setActivePlan] = useState<SchoolActivePlan | null>(null);
	const [threads, setThreads] = useState<SchoolThread[]>([]);
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const { user } = useAuth();
	const pathname = usePathname();

	const isCourseMode = pathname.startsWith("/courses");
	const accentColor = isCourseMode ? "#7c3aed" : "#1973fd"; // violet-600 vs blue-600
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-[#1973fd]";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-[#1973fd]";
	const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-[#0f63e9]";
	const accentShadowClass = isCourseMode ? "shadow-[0_16px_34px_rgba(124,58,237,0.26)]" : "shadow-[0_16px_34px_rgba(25,115,253,0.26)]";
	const accentLightBgClass = isCourseMode ? "bg-violet-600/10" : "bg-[#1973fd]/10";

	useEffect(() => {
		let mounted = true;

		const fetchData = async () => {
			try {
				setLoading(true);
				const [schoolData, coursesData, planData] = await Promise.all([
					schoolsService.getMySchool().catch(() => null),
					coursesService.listMine(),
					subscriptionsService.getActivePlan().catch(() => null),
				]);

				if (mounted) {
					setSchool(schoolData);
					setCourses(coursesData);
					setActivePlan(planData);
				}

				if (user?.id) {
					const threadData = await messagesService.listSchoolThreads(user.id);
					if (mounted) setThreads(threadData);
				}
			} catch {
				if (mounted) setError("No se pudo cargar el resumen de tu panel.");
			} finally {
				if (mounted) setLoading(false);
			}
		};


		void fetchData();
		return () => {
			mounted = false;
		};
	}, [user?.id]);

	const stats = useMemo(() => {
		const active = courses.filter(
			(course) => course.isActive && course.status !== "archived",
		).length;
		const today = new Date().toDateString();
		const msgToday = threads.filter(
			(thread) => new Date(thread.lastMessageAt).toDateString() === today,
		).length;
		const unread = threads.reduce((sum, thread) => sum + thread.unreadCount, 0);
		const pending = threads.filter((thread) => thread.threadHasUnread).length;

		return { active, msgToday, unread, pending };
	}, [courses, threads]);

	const completion = useMemo(() => {
		const checks = [
			school?.name,
			school?.description,
			school?.logoUrl,
			school?.coverImageUrl,
			school?.address,
			school?.city,
			school?.educationalLevel,
			school?.institutionType,
			school?.schedule,
			school?.languages,
			school?.monthlyPrice,
		];
		const completed = checks.filter(Boolean).length;
		return Math.round((completed / checks.length) * 100);
	}, [school]);

	const locationLabel = [school?.city, school?.address].filter(Boolean).join(" · ");
	const latestThreads = threads.slice(0, 3);
	const visibleCourses = courses.slice(0, 3);
	const schoolInitials = school?.name
		? school.name
				.split(" ")
				.slice(0, 2)
				.map((word) => word.charAt(0).toUpperCase())
				.join("")
		: "SC";
	const planName = activePlan
		? activePlan.plan.name.replace("_SUBSCRIPTION", "").replaceAll("_", " ")
		: "Plan pendiente";

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-slate-400" />
			</div>
		);
	}

	if (error) {
		return (
			<section className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-5">
				<p className="text-sm font-medium text-rose-600">{error}</p>
			</section>
		);
	}

	return (
		<div className="space-y-8">
			<section className="rounded-[2rem] border border-slate-200 bg-white px-7 py-7 shadow-[0_20px_60px_rgba(15,23,42,0.06)] lg:px-10 lg:py-9">
				<div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-center">
					<div className="min-w-0">
						<p className="text-xs font-bold uppercase text-slate-400">
							{isCourseMode ? "Panel de instructor" : "Panel escolar"}
						</p>
						<h1 className="mt-4 max-w-4xl text-4xl font-bold leading-[1.04] text-slate-950 lg:text-6xl">
							{school?.name ?? (isCourseMode ? "Mi perfil" : "Mi institución")}
						</h1>
						<p className="mt-5 max-w-4xl text-lg leading-8 text-slate-600">
							{school?.description?.trim() ||
								"Administra tu presencia, da seguimiento a familias interesadas y mantén tu oferta académica lista para recibir prospectos."}
						</p>

						<div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-slate-600">
							{!isCourseMode && <Meta icon={GraduationCap} label={school?.educationalLevel || "Nivel por definir"} />}
							{!isCourseMode && <Meta icon={Clock3} label={school?.schedule || "Horario por definir"} />}
							<Meta icon={BookOpen} label={`${courses.length} ${isCourseMode ? "cursos publicados" : "programas"}`} />
							<Meta
								icon={Star}
								label={`${Number(school?.averageRating ?? 0).toFixed(1)} (${school?.ratingsCount ?? 0})`}
								accent
							/>
						</div>

						<div className="mt-8 flex flex-wrap items-center gap-4">
							<Link
								href={isCourseMode ? "/courses/academic?create=1" : "/schools/courses?create=1"}
								className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl ${accentBgClass} px-6 py-3 text-sm font-bold text-white ${accentShadowClass} transition ${accentHoverBgClass}`}
							>
								{isCourseMode ? "Crear curso" : "Publicar programa"}
								<ArrowRight size={17} />
							</Link>
							<div className="flex items-center gap-3 text-sm font-medium text-slate-600">
								<AvatarStack initials={["FA", "MG", "LR"]} />
								<span>{threads.length || 0} familias en seguimiento</span>
							</div>
						</div>
					</div>

					<DashboardIllustration accentColor={accentColor} />
				</div>

				<div className="mt-8 grid gap-3 border-t border-slate-200 pt-6 sm:grid-cols-2 xl:grid-cols-4">
					<Link href={isCourseMode ? "/courses/leads" : "/schools/leads"} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
						<StatPill icon={Users} label="Prospectos" value={`${threads.length}`} detail={`${stats.unread} sin leer`} />
					</Link>
					<Link href={isCourseMode ? "/courses/academic" : "/schools/courses"} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
						<StatPill icon={Layers3} label={isCourseMode ? "Cursos activos" : "Oferta activa"} value={`${stats.active}`} detail={`${courses.length} total`} />
					</Link>
					<Link href={isCourseMode ? "/courses/messages" : "/schools/messages"} className="block transition-transform hover:scale-[1.02] active:scale-[0.98]">
						<StatPill icon={MessageCircle} label="Mensajes hoy" value={`${stats.msgToday}`} detail={`${stats.pending} hilos activos`} />
					</Link>
					<div className="block transition-transform hover:scale-[1.02]">
						<StatPill icon={ShieldCheck} label="Perfil" value={`${completion}%`} detail={school?.isVerified ? "Verificado" : "En revisión"} />
					</div>
				</div>
			</section>

			<section className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
				<div className="min-w-0 space-y-7">
					<div>
						<div className="flex items-start justify-between gap-4">
							<div>
								<p className="text-xs font-bold uppercase text-slate-400">
									Nivel 1
								</p>
								<h2 className="mt-2 text-3xl font-bold text-slate-950">
									{isCourseMode ? "Tus cursos y programas" : "Operación de tu escuela"}
								</h2>
								<p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
									Completa las acciones principales para que las familias encuentren información clara y puedan contactarte rápido.
								</p>
							</div>
							<Link
								href={isCourseMode ? "/courses/settings" : "/schools/settings"}
								className={`hidden items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 ${isCourseMode ? "hover:text-violet-600" : "hover:text-[#1973fd]"} sm:inline-flex`}
							>
								Ajustar perfil
								<ArrowRight size={16} />
							</Link>
						</div>

						<div className="mt-6 space-y-4">
							<ActionCard
								active
								icon={<Sparkles className={isCourseMode ? "text-violet-600" : "text-[#1973fd]"} size={30} />}
								title={isCourseMode ? "Completar perfil de instructor" : "Completar perfil institucional"}
								description={`${completion}% completado`}
								href={isCourseMode ? "/courses/settings" : "/schools/settings"}
								accentBgClass={accentBgClass}
								accentColorClass={isCourseMode ? "border-violet-600 shadow-[0_0_0_3px_rgba(124,58,237,0.10)]" : "border-[#1973fd] shadow-[0_0_0_3px_rgba(25,115,253,0.10)]"}
								trailing={<span className={`flex h-9 w-9 items-center justify-center rounded-full ${accentBgClass} text-sm font-bold text-white`}>{schoolInitials.slice(0, 1)}</span>}
							/>
							{visibleCourses.map((course) => (
								<ActionCard
									key={course.id}
									icon={<CourseIcon status={course.status} imageUrl={course.coverImageUrl} accentColorClass={accentBgClass} />}
									title={course.name}
									description={`${course.modality || "Modalidad por definir"} · ${formatCurrency(course.price)}`}
									href={isCourseMode ? "/courses/academic" : "/schools/courses"}
									trailing={<CourseStatus course={course} />}
								/>
							))}
							<ActionCard
								icon={<Send className="text-slate-700" size={28} />}
								title="Responder conversaciones recientes"
								description={stats.unread > 0 ? `${stats.unread} mensajes pendientes` : "Bandeja al día"}
								href={isCourseMode ? "/courses/messages" : "/schools/messages"}
								trailing={<CheckCircle2 className={stats.unread > 0 ? (isCourseMode ? "text-violet-600" : "text-[#1973fd]") : "text-slate-300"} size={28} />}
							/>
						</div>
					</div>

					<div className="rounded-[2rem] border border-slate-200 bg-white">
						<div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
							<div>
								<h3 className="text-xl font-bold text-slate-950">
									Conversaciones recientes
								</h3>
								<p className="mt-1 text-sm text-slate-500">
									Última actividad de familias y prospectos.
								</p>
							</div>
							<Link
								href={isCourseMode ? "/courses/messages" : "/schools/messages"}
								className={`text-sm font-bold ${accentTextClass}`}
							>
								Ver todas
							</Link>
						</div>
						<div className="divide-y divide-slate-100">
							{latestThreads.length ? (
								latestThreads.map((thread) => (
									<div key={thread.publicUserId} className="flex items-center gap-4 px-6 py-4">
										<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-700">
											{thread.publicUserName.slice(0, 2).toUpperCase()}
										</div>
										<div className="min-w-0 flex-1">
											<div className="flex items-center justify-between gap-3">
												<p className="truncate text-sm font-bold text-slate-950">
													{thread.publicUserName}
												</p>
												<span className="shrink-0 text-xs font-medium text-slate-400">
													{formatRelativeDate(thread.lastMessageAt)}
												</span>
											</div>
											<p className="mt-1 truncate text-sm text-slate-600">
												{thread.lastMessage}
											</p>
										</div>
										{thread.unreadCount > 0 ? (
											<span className={`flex h-6 min-w-6 items-center justify-center rounded-full ${accentBgClass} px-2 text-xs font-bold text-white`}>
												{thread.unreadCount}
											</span>
										) : null}
									</div>
								))
							) : (
								<EmptyState
									title="Todavía no hay conversaciones"
									description="Cuando una familia te escriba, verás la actividad aquí."
								/>
							)}
						</div>
					</div>
				</div>

				<aside className="space-y-5">
					<div className="rounded-[2rem] border-[8px] border-slate-100 bg-white p-6 text-center shadow-sm">
						<div className={`mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] ${accentLightBgClass}`}>
							{school?.logoUrl ? (
								// eslint-disable-next-line @next/next/no-img-element
								<img
									src={school.logoUrl}
									alt={school.name}
									className="h-16 w-16 rounded-2xl object-cover"
								/>
							) : (
								<span className={`text-2xl font-bold ${accentTextClass}`}>
									{schoolInitials}
								</span>
							)}
						</div>
						<h3 className="mt-5 text-xl font-bold text-slate-950">
							Tu perfil escolar
						</h3>
						<div className="mx-auto mt-4 h-2 w-44 rounded-full bg-slate-100">
							<div
								className={`h-full rounded-full ${accentBgClass}`}
								style={{ width: `${completion}%` }}
							/>
						</div>
						<p className="mt-3 text-sm font-semibold text-slate-500">
							{completion}% completado
						</p>
					</div>

					<div className="space-y-3 text-sm font-medium text-slate-600">
						<InfoLine icon={CalendarDays} label={`Actualizado ${formatShortDate(school?.updatedAt)}`} />
						{!isCourseMode && <InfoLine icon={Globe2} label={school?.languages || "Idiomas por definir"} />}
						<InfoLine icon={MapPin} label={locationLabel || "Ubicación pendiente"} />
						<InfoLine icon={Wifi} label={isCourseMode ? "Disponible para tutorías en línea" : "Disponible para familias en línea"} />
						<InfoLine icon={CreditCard} label={planName} />
					</div>

					<div className="rounded-[2rem] border border-slate-200 bg-white p-5">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs font-bold uppercase text-slate-400">
									{isCourseMode ? "Estado" : "Inscripciones"}
								</p>
								<p className="mt-2 text-2xl font-bold text-slate-950">
									{school?.enrollmentOpen ? (isCourseMode ? "Activo" : "Abiertas") : (isCourseMode ? "Inactivo" : "Cerradas")}
								</p>
							</div>
							<span className={`h-3 w-3 rounded-full ${school?.enrollmentOpen ? "bg-emerald-500" : "bg-slate-300"}`} />
						</div>
						<div className="mt-5 grid grid-cols-2 gap-3">
							<MiniMetric label="Favoritos" value={`${school?.favoritesCount ?? 0}`} />
							<MiniMetric label="Ranking" value={`${school?.rankingScore ?? 0}`} />
						</div>
					</div>
				</aside>
			</section>
		</div>
	);
}

function Meta({
	icon: Icon,
	label,
	accent = false,
}: {
	icon: LucideIcon;
	label: string;
	accent?: boolean;
}) {
	return (
		<span className="inline-flex items-center gap-2">
			<Icon size={18} className={accent ? "text-amber-400" : "text-slate-400"} />
			{label}
		</span>
	);
}

function DashboardIllustration({ accentColor = "#1973fd" }: { accentColor?: string }) {
	return (
		<div className="relative mx-auto h-64 w-72">
			<div className="absolute left-8 top-28 h-28 w-56 rotate-[-1deg] rounded-[2rem] border-[5px] border-slate-950 shadow-[0_18px_0_rgba(15,23,42,0.06)]" style={{ backgroundColor: accentColor }} />
			<div className="absolute left-10 top-20 h-28 w-52 rotate-[2deg] rounded-[2rem] border-[5px] border-slate-950 bg-[#8ea6ff]" />
			<div className="absolute left-14 top-9 h-24 w-44 rotate-[5deg] rounded-[2rem] border-[5px] border-slate-950 bg-[#ede7ff]" />
			<div className="absolute bottom-3 right-1 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_12px_30px_rgba(15,23,42,0.18)]">
				<Play className="fill-current text-slate-950" size={24} style={{ color: accentColor }} />
			</div>
		</div>
	);
}

function AvatarStack({ initials }: { initials: string[] }) {
	return (
		<div className="flex -space-x-2">
			{initials.map((initial, index) => (
				<span
					key={initial}
					className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-bold text-slate-700"
					style={{ zIndex: initials.length - index }}
				>
					{initial}
				</span>
			))}
		</div>
	);
}

function StatPill({
	icon: Icon,
	label,
	value,
	detail,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	detail: string;
}) {
	return (
		<div className="rounded-2xl bg-slate-50 px-4 py-4">
			<div className="flex items-center justify-between">
				<p className="text-xs font-bold uppercase text-slate-400">{label}</p>
				<Icon size={17} className="text-slate-400" />
			</div>
			<p className="mt-3 text-2xl font-bold text-slate-950">{value}</p>
			<p className="mt-1 text-sm font-medium text-slate-500">{detail}</p>
		</div>
	);
}

function ActionCard({
	icon,
	title,
	description,
	href,
	trailing,
	active = false,
	accentBgClass = "bg-[#1973fd]",
	accentColorClass = "border-[#1973fd] shadow-[0_0_0_3px_rgba(25,115,253,0.10)]",
}: {
	icon: React.ReactNode;
	title: string;
	description: string;
	href: string;
	trailing: React.ReactNode;
	active?: boolean;
	accentBgClass?: string;
	accentColorClass?: string;
}) {
	return (
		<Link
			href={href}
			className={`relative flex min-h-24 items-center gap-5 rounded-[1.5rem] border bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_16px_40px_rgba(15,23,42,0.08)] ${
				active
					? accentColorClass
					: "border-slate-200"
			}`}
		>
			{active ? (
				<span className={`absolute -top-5 left-1/2 -translate-x-1/2 rounded-2xl ${accentBgClass} px-5 py-2 text-sm font-bold text-white shadow-lg`}>
					Iniciar
				</span>
			) : null}
			<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-50">
				{icon}
			</div>
			<div className="min-w-0 flex-1">
				<p className="truncate text-lg font-bold text-slate-950">{title}</p>
				<p className="mt-1 truncate text-sm font-medium text-slate-500">
					{description}
				</p>
			</div>
			{trailing}
		</Link>
	);
}

function CourseIcon({ status, imageUrl, accentColorClass = "bg-[#1973fd]" }: { status: Course["status"]; imageUrl?: string | null; accentColorClass?: string }) {
	if (imageUrl) {
		return (
			<img
				src={imageUrl}
				alt="Curso"
				className="h-full w-full object-cover rounded-xl"
			/>
		);
	}

	const color =
		status === "published"
			? "bg-emerald-500"
			: status === "draft"
				? "bg-amber-400"
				: "bg-slate-300";

	return (
		<div className="grid grid-cols-2 gap-1">
			<span className={`h-4 w-4 rounded ${color}`} />
			<span className={`h-4 w-4 rounded ${accentColorClass}`} />
			<span className="h-4 w-4 rounded bg-slate-950" />
			<span className="h-4 w-4 rounded bg-slate-200" />
		</div>
	);
}

function CourseStatus({ course }: { course: Course }) {
	if (course.isActive && course.status === "published") {
		return <CheckCircle2 className="text-emerald-500" size={28} />;
	}

	return (
		<span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
			{course.status}
		</span>
	);
}

function InfoLine({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
	return (
		<div className="flex items-center gap-3">
			<Icon size={18} className="shrink-0 text-slate-500" />
			<span>{label}</span>
		</div>
	);
}

function MiniMetric({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl bg-slate-50 p-4">
			<p className="text-xs font-bold uppercase text-slate-400">{label}</p>
			<p className="mt-2 text-xl font-bold text-slate-950">{value}</p>
		</div>
	);
}

function EmptyState({
	title,
	description,
}: {
	title: string;
	description: string;
}) {
	return (
		<div className="px-6 py-10 text-center">
			<p className="text-sm font-bold text-slate-900">{title}</p>
			<p className="mt-2 text-sm text-slate-500">{description}</p>
		</div>
	);
}
