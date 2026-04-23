"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, MessageCircle, User } from "lucide-react";

import { messagesService, type SchoolThread } from "@/lib/services/services/messages.service";
import { updateLeadStatus } from "@/lib/services/leadsService";
// Toast minimalista para errores
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
	if (!message) return null;
	return (
		<div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-rose-600 px-4 py-2 text-white shadow-lg animate-fade-in">
			<span>{message}</span>
			<button className="ml-3 text-white/80 hover:text-white" onClick={onClose}>&times;</button>
		</div>
	);
}
import { useAuth } from "@/contexts/AuthContext";

type LeadStage = "nuevo_contacto" | "interesado" | "visita" | "inscrito";
type LeadsFilter = "today" | "week";
type LeadStep = 1 | 2 | 3;

type LeadRecord = {
	stage: LeadStage;
	tags: string[];
	notes: string;
	reminderAt: string;
	profileViews: number;
	contactClicks: number;
	step: LeadStep;
};

const LEADS_STORAGE_PREFIX = "skoolia:school-leads-v2";

const STAGE_META: Record<
	LeadStage,
	{ label: string; classes: string; description: string }
> = {
	nuevo_contacto: {
		label: "Nuevo contacto",
		classes: "bg-amber-50 text-amber-700",
		description: "Contacto nuevo por atender.",
	},
	interesado: {
		label: "Interesado",
		classes: "bg-indigo-50 text-indigo-700",
		description: "Mostró interés en oferta académica.",
	},
	visita: {
		label: "Visita",
		classes: "bg-cyan-50 text-cyan-700",
		description: "Agendó o realizó visita.",
	},
	inscrito: {
		label: "Inscrito",
		classes: "bg-emerald-50 text-emerald-700",
		description: "Conversión exitosa.",
	},
};

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

function getStorageKey(ownerId?: string) {
	return `${LEADS_STORAGE_PREFIX}:${ownerId ?? "anon"}`;
}

function normalizeStoredStage(stage?: string): LeadStage {
	if (stage === "nuevo_contacto" || stage === "interesado" || stage === "visita" || stage === "inscrito") {
		return stage;
	}

	if (stage === "nuevo") return "nuevo_contacto";
	if (stage === "contactado") return "interesado";
	if (stage === "perdido") return "interesado";

	return "nuevo_contacto";
}

function readLeads(ownerId?: string): Record<string, LeadRecord> {
	if (typeof window === "undefined") return {};

	try {
		const raw = localStorage.getItem(getStorageKey(ownerId));
		if (!raw) return {};
		const parsed = JSON.parse(raw) as Record<string, Partial<LeadRecord>>;

		return Object.fromEntries(
			Object.entries(parsed).map(([publicUserId, value]) => [
				publicUserId,
				{
					stage: normalizeStoredStage(value.stage),
					tags: Array.isArray(value.tags) ? value.tags.filter(Boolean).slice(0, 8) : [],
					notes: typeof value.notes === "string" ? value.notes : "",
					reminderAt: typeof value.reminderAt === "string" ? value.reminderAt : "",
					profileViews: typeof value.profileViews === "number" ? value.profileViews : 0,
					contactClicks: typeof value.contactClicks === "number" ? value.contactClicks : 0,
					step:
						value.step === 1 || value.step === 2 || value.step === 3
							? value.step
							: 1,
				},
			]),
		);
	} catch {
		return {};
	}
}

function writeLeads(leads: Record<string, LeadRecord>, ownerId?: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(getStorageKey(ownerId), JSON.stringify(leads));
}

function inferDefaultStage(thread: SchoolThread): LeadStage {
	if (thread.threadHasUnread) {
		return "nuevo_contacto";
	}

	if (thread.lastSenderRole === "private") {
		return "interesado";
	}

	return "nuevo_contacto";
}

function createDefaultLead(thread: SchoolThread): LeadRecord {
	return {
		stage: inferDefaultStage(thread),
		tags: [],
		notes: "",
		reminderAt: "",
		profileViews: 0,
		contactClicks: 0,
		step: 1,
	};
}

export default function SchoolLeadsSection() {
	const [toast, setToast] = useState("");
	const [reminderToast, setReminderToast] = useState<string>("");
	const { user } = useAuth();
	const [threads, setThreads] = useState<SchoolThread[]>([]);
	const [filter, setFilter] = useState<LeadsFilter>("week");
	const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
	const [leads, setLeads] = useState<Record<string, LeadRecord>>({});
	const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
	const [tagsDraft, setTagsDraft] = useState("");
	const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [search, setSearch] = useState("");
	const [tagFilter, setTagFilter] = useState("");

	useEffect(() => {
		setLeads(readLeads(user?.id));
	}, [user?.id]);

	useEffect(() => {
		let mounted = true;

		(async () => {
			try {
				setLoading(true);
				setError(null);
				const data = await messagesService.listSchoolThreads();
				if (mounted) setThreads(data);
			} catch (err) {
				if (!mounted) return;
				console.error("No se pudieron cargar los prospectos", err);
				setError("No se pudieron cargar tus prospectos.");
			} finally {
				if (mounted) setLoading(false);
			}
		})();

		return () => {
			mounted = false;
		};
	}, []);

	useEffect(() => {
		if (!threads.length) return;

		setLeads((prev) => {
			let changed = false;
			const next = { ...prev };

			threads.forEach((thread) => {
				const previous = next[thread.publicUserId];
				if (!previous) {
					next[thread.publicUserId] = createDefaultLead(thread);
					changed = true;
					return;
				}

				const normalizedStage = normalizeStoredStage(previous.stage);
				if (normalizedStage !== previous.stage) {
					next[thread.publicUserId] = { ...previous, stage: normalizedStage };
					changed = true;
				}
			});

			if (changed) {
				writeLeads(next, user?.id);
			}

			return changed ? next : prev;
		});
	}, [threads, user?.id]);

	useEffect(() => {
		if (!threads.length) {
			setActiveLeadId(null);
			return;
		}

		setActiveLeadId((current) => {
			if (current && threads.some((thread) => thread.publicUserId === current)) {
				return current;
			}
			return threads[0]?.publicUserId ?? null;
		});
	}, [threads]);

	// Optimistic UI para cambio de estado
	const patchLead = (publicUserId: string, patch: Partial<LeadRecord>, optimistic?: boolean) => {
		setLeads((prev) => {
			const current = prev[publicUserId];
			if (!current) return prev;
			const next = {
				...prev,
				[publicUserId]: {
					...current,
					...patch,
				},
			};
			writeLeads(next, user?.id);
			setLastSavedAt(new Date().toISOString());
			return next;
		});
	};

	// Handler para cambio de estado con Optimistic UI
	const handleStageChange = async (publicUserId: string, newStage: LeadStage) => {
		const prevStage = leads[publicUserId]?.stage;
		patchLead(publicUserId, { stage: newStage }, true);
		try {
			await updateLeadStatus(publicUserId, newStage);
		} catch (err) {
			patchLead(publicUserId, { stage: prevStage }, true);
			setToast("No se pudo actualizar el estado del lead. Intenta de nuevo.");
		}
	};

	const stageCounters = useMemo(() => {
		const counters: Record<LeadStage, number> = {
			nuevo_contacto: 0,
			interesado: 0,
			visita: 0,
			inscrito: 0,
		};

		threads.forEach((thread) => {
			const stage = leads[thread.publicUserId]?.stage ?? inferDefaultStage(thread);
			counters[stage] += 1;
		});

		return counters;
	}, [leads, threads]);

	const analytics = useMemo(() => {
		const totalProfileViews = Object.values(leads).reduce((acc, lead) => acc + lead.profileViews, 0);
		const totalContactClicks = Object.values(leads).reduce((acc, lead) => acc + lead.contactClicks, 0);

		const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
		const leadsPerWeek = threads.filter((thread) => {
			const date = new Date(thread.lastMessageAt);
			if (Number.isNaN(date.getTime())) return false;
			return date.getTime() >= oneWeekAgo;
		}).length;

		const responded = threads.filter((thread) => thread.lastSenderRole === "private").length;
		const responseRate = threads.length ? Math.round((responded / threads.length) * 100) : 0;

		return {
			totalProfileViews,
			totalContactClicks,
			leadsPerWeek,
			responseRate,
		};
	}, [leads, threads]);

	const filteredThreads = useMemo(() => {
		const now = Date.now();
		const threshold = filter === "today" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
		return threads.filter((thread) => {
			const date = new Date(thread.lastMessageAt);
			if (Number.isNaN(date.getTime())) return false;
			const timeMatch = now - date.getTime() <= threshold;
			if (!timeMatch) return false;
			if (stageFilter !== "all") {
				const stage = leads[thread.publicUserId]?.stage ?? inferDefaultStage(thread);
				if (stage !== stageFilter) return false;
			}
			if (search && !thread.publicUserName.toLowerCase().includes(search.toLowerCase())) return false;
			if (tagFilter) {
				const tags = leads[thread.publicUserId]?.tags || [];
				if (!tags.some((t) => t.toLowerCase().includes(tagFilter.toLowerCase()))) return false;
			}
			return true;
		});
	}, [filter, leads, stageFilter, threads, search, tagFilter]);

	const activeThread = useMemo(
		() => filteredThreads.find((thread) => thread.publicUserId === activeLeadId) ?? null,
		[activeLeadId, filteredThreads],
	);

	const activeLead = useMemo(() => {
		if (!activeThread) return null;
		return leads[activeThread.publicUserId] ?? createDefaultLead(activeThread);
	}, [activeThread, leads]);

	useEffect(() => {
		if (!activeThread) return;
		const record = leads[activeThread.publicUserId];
		setTagsDraft((record?.tags ?? []).join(", "));
	}, [activeThread?.publicUserId, leads]);

	useEffect(() => {
		if (!activeLeadId) return;
		if (!leads[activeLeadId]) return;

		patchLead(activeLeadId, {
			profileViews: (leads[activeLeadId]?.profileViews ?? 0) + 1,
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeLeadId]);

	const autosaveLabel = lastSavedAt
		? `Guardado automático ${formatRelativeDate(lastSavedAt)}`
		: "Guardado automático activo";

	const tagsList = tagsDraft
		.split(",")
		.map((tag) => tag.trim())
		.filter(Boolean)
		.slice(0, 8);

	// Notificación automática para recordatorios próximos/pasados
	useEffect(() => {
		const now = Date.now();
		const soon = Object.entries(leads)
			.filter(([, lead]) => lead.reminderAt && new Date(lead.reminderAt).getTime() <= now + 10 * 60 * 1000 && new Date(lead.reminderAt).getTime() > now - 60 * 60 * 1000)
			.map(([id, lead]) => ({ id, ...lead }));
		if (soon.length) {
			const msg = soon
				.map(l => `⏰ Recordatorio: ${l.tags?.length ? `#${l.tags.join(", ")} - ` : ""}${l.notes?.slice(0, 40) || "Lead"} (${l.reminderAt && new Date(l.reminderAt).toLocaleString("es-MX")})`)
				.join("\n");
			setReminderToast(msg);
		}
	}, [leads]);

	return (
		<section className="space-y-5 sm:space-y-6">
			<div className="surface rounded-4xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">Leads escolares</h2>
						<p className="mt-1 text-sm text-slate-600">
							Pipeline operativo diario: nuevo contacto, interesado, visita e inscrito.
						</p>
					</div>
					<div className="flex flex-col gap-2 sm:flex-row sm:items-center">
						<input
							type="text"
							placeholder="Buscar por nombre..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs sm:text-sm"
						/>
						<input
							type="text"
							placeholder="Filtrar por etiqueta..."
							value={tagFilter}
							onChange={e => setTagFilter(e.target.value)}
							className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs sm:text-sm"
						/>
						<div className="inline-flex rounded-2xl bg-slate-100 p-1">
							<button
								type="button"
								onClick={() => setFilter("today")}
								className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
									filter === "today" ? "bg-white text-slate-700 shadow" : "text-slate-500"
								}`}
							>
								Hoy
							</button>
							<button
								type="button"
								onClick={() => setFilter("week")}
								className={`rounded-xl px-3 py-1.5 text-xs font-bold ${
									filter === "week" ? "bg-white text-slate-700 shadow" : "text-slate-500"
								}`}
							>
								7 días
							</button>
						</div>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
					<div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
						<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Vistas del perfil</p>
						<p className="mt-1 text-2xl font-extrabold text-slate-900">{analytics.totalProfileViews}</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
						<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Clics en contacto</p>
						<p className="mt-1 text-2xl font-extrabold text-slate-900">{analytics.totalContactClicks}</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
						<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Leads por semana</p>
						<p className="mt-1 text-2xl font-extrabold text-slate-900">{analytics.leadsPerWeek}</p>
					</div>
					<div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3">
						<p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Tasa de respuesta</p>
						<p className="mt-1 text-2xl font-extrabold text-slate-900">{analytics.responseRate}%</p>
					</div>
				</div>
			</div>

			<div className="surface overflow-hidden rounded-4xl bg-white shadow-sm ring-1 ring-black/5">
				<div className="grid grid-cols-2 gap-2 border-b border-slate-100/70 bg-slate-50/70 px-4 py-3 sm:grid-cols-4 sm:px-6">
					{(Object.keys(STAGE_META) as LeadStage[]).map((stage) => {
						const meta = STAGE_META[stage];
						const active = stageFilter === stage;

						return (
							<button
								key={stage}
								type="button"
								onClick={() => setStageFilter(active ? "all" : stage)}
								className={`rounded-2xl border px-3 py-2 text-left transition ${
									active
										? "border-indigo-300 bg-indigo-50"
										: "border-slate-200 bg-white hover:bg-slate-50"
								}`}
							>
								<p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">{meta.label}</p>
								<p className="mt-1 text-base font-extrabold text-slate-900">{stageCounters[stage]}</p>
							</button>
						);
					})}
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
					<div className="divide-y divide-slate-100/70">
				{loading ? (
					<div className="px-5 py-4 text-sm text-slate-500 sm:px-6 sm:py-5">
						Cargando prospectos...
					</div>
				) : null}

				{error ? (
					<div className="px-5 py-4 text-sm text-rose-600 sm:px-6 sm:py-5">
						{error}
					</div>
				) : null}

				{filteredThreads.map((thread) => {
					const lead = leads[thread.publicUserId] ?? createDefaultLead(thread);
					const stage = lead.stage;
					const status = STAGE_META[stage];
					const unreadDescription = thread.threadHasUnread
						? `${thread.unreadCount} mensaje${thread.unreadCount === 1 ? "" : "s"} sin leer`
						: status.description;
					const isActive = thread.publicUserId === activeLeadId;

					return (
						<div
							key={thread.publicUserId}
							className={`flex cursor-pointer items-center justify-between px-5 py-4 transition sm:px-6 sm:py-5 ${
								isActive ? "bg-indigo-50/60" : "hover:bg-slate-50"
							}`}
							onClick={() => setActiveLeadId(thread.publicUserId)}
						>
							<div className="flex items-center gap-3 sm:gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-700">
									{thread.publicUserName
										.split(" ")
										.map((p) => p[0])
										.join("")}
								</div>
								<div>
									<p className="text-sm sm:text-base font-extrabold text-slate-900">
										{thread.publicUserName}
									</p>
									<p className="mt-0.5 text-[11px] sm:text-xs font-bold uppercase tracking-wide text-slate-400">
										Interacción activa
									</p>
									<p className="mt-1 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs font-semibold text-slate-500">
										<span className="inline-flex items-center gap-1">
											<User size={12} className="text-slate-400" />
											Mensaje recibido
										</span>
										<span className="h-1 w-1 rounded-full bg-slate-300" />
										<span>{formatRelativeDate(thread.lastMessageAt)}</span>
									</p>
									<p className="mt-1 text-[11px] font-semibold text-slate-500">
										{unreadDescription}
									</p>
									<p className="mt-2 max-w-xl text-xs text-slate-600 sm:text-sm">
										{thread.lastMessage}
									</p>
									{lead.tags.length ? (
										<div className="mt-2 flex flex-wrap gap-1">
											{lead.tags.slice(0, 3).map((tag) => (
												<span
													key={`${thread.publicUserId}-${tag}`}
													className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
												>
													#{tag}
												</span>
											))}
										</div>
									) : null}
								</div>
							</div>
							<div className="flex items-center gap-3">
												{/* Selector de estado minimalista */}
												<select
													value={lead.stage}
													onChange={e => handleStageChange(thread.publicUserId, e.target.value as LeadStage)}
													className={`rounded-full border px-2 py-1 text-xs font-bold transition ${status.classes} focus:outline-none focus:ring-2 focus:ring-indigo-300`}
													style={{ minWidth: 110 }}
												>
													<option value="nuevo_contacto">Nuevo contacto</option>
													<option value="interesado">Interesado</option>
													<option value="visita">Visita</option>
													<option value="inscrito">Inscrito</option>
												</select>
								<div className="flex items-center gap-1 sm:gap-2">
									<Link
										href={`/schools/messages?thread=${thread.publicUserId}`}
										onClick={() => {
											patchLead(thread.publicUserId, {
												contactClicks: (leads[thread.publicUserId]?.contactClicks ?? 0) + 1,
											});
										}}
										className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
									>
										<MessageCircle size={16} />
										Ver conversación
									</Link>
								</div>
							</div>
						</div>
					);
				})}

				{!loading && !error && !filteredThreads.length ? (
					<div className="px-5 py-8 text-sm text-slate-500 sm:px-6">
						No hay prospectos en el periodo seleccionado.
					</div>
				) : null}
					</div>

					<aside className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-6 lg:border-l lg:border-t-0">
						{activeThread && activeLead ? (
							<div className="space-y-4">
								<div>
									<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Gestión de lead</p>
									<h3 className="mt-1 text-lg font-extrabold text-slate-900">{activeThread.publicUserName}</h3>
									<p className="mt-1 text-xs font-semibold text-emerald-700">{autosaveLabel}</p>
								</div>

								<div className="grid grid-cols-3 gap-2">
									{([1, 2, 3] as LeadStep[]).map((step) => (
										<button
											key={step}
											type="button"
											onClick={() => patchLead(activeThread.publicUserId, { step })}
											className={`rounded-xl px-2 py-2 text-xs font-bold ${
												activeLead.step === step
													? "bg-slate-900 text-white"
													: "bg-white text-slate-500 ring-1 ring-slate-200"
											}`}
										>
											Paso {step}
										</button>
									))}
								</div>

								{activeLead.step === 1 ? (
									<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
										<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paso 1: Pipeline + etiquetas</p>
										<select
											value={activeLead.stage}
											onChange={(event) =>
												patchLead(activeThread.publicUserId, {
													stage: event.target.value as LeadStage,
												})
											}
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
										>
											<option value="nuevo_contacto">Nuevo contacto</option>
											<option value="interesado">Interesado</option>
											<option value="visita">Visita</option>
											<option value="inscrito">Inscrito</option>
										</select>
										<input
											type="text"
											value={tagsDraft}
											onChange={(event) => {
												setTagsDraft(event.target.value);
												const nextTags = event.target.value
													.split(",")
													.map((tag) => tag.trim())
													.filter(Boolean)
													.slice(0, 8);
												patchLead(activeThread.publicUserId, { tags: nextTags });
											}}
											placeholder="Etiquetas separadas por coma"
											className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
										/>
										<div className="flex flex-wrap gap-1">
											{tagsList.map((tag) => (
												<span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
													#{tag}
												</span>
											))}
										</div>
									</div>
								) : null}

								{activeLead.step === 2 ? (
									<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
										<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paso 2: Notas internas</p>
										<textarea
											value={activeLead.notes}
											onChange={(event) => patchLead(activeThread.publicUserId, { notes: event.target.value })}
											placeholder="Escribe contexto de seguimiento, objeciones, acuerdos y próximos pasos."
											rows={7}
											className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
										/>
									</div>
								) : null}

								{activeLead.step === 3 ? (
									<div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-3">
										<p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paso 3: Recordatorio</p>
										<label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
											<CalendarClock size={14} />
											<input
												type="datetime-local"
												value={activeLead.reminderAt}
												onChange={(event) =>
													patchLead(activeThread.publicUserId, {
														reminderAt: event.target.value,
													})
												}
												className="w-full bg-transparent outline-none"
											/>
										</label>
										{activeLead.reminderAt ? (
											<p className="text-xs font-semibold text-slate-500">
												Recordatorio programado para {new Date(activeLead.reminderAt).toLocaleString("es-MX")}
											</p>
										) : (
											<p className="text-xs font-semibold text-slate-500">Sin recordatorio activo.</p>
										)}
									</div>
								) : null}
							</div>
						) : (
							<p className="text-sm text-slate-500">Selecciona un lead para ver sus pasos y borrador.</p>
						)}
					</aside>
				</div>
			</div>
		<Toast message={toast} onClose={() => setToast("")} />
		{reminderToast && (
			<div className="fixed top-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-white shadow-lg animate-fade-in">
				<CalendarClock size={18} />
				<span className="whitespace-pre-line">{reminderToast}</span>
				<button className="ml-3 text-white/80 hover:text-white" onClick={() => setReminderToast("")}>&times;</button>
			</div>
		)}
		</section>
	);
}
