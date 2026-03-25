"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MessageCircle, User } from "lucide-react";

import { messagesService, type SchoolThread } from "@/lib/services/services/messages.service";
import { useAuth } from "@/contexts/AuthContext";

type LeadStage = "nuevo" | "contactado" | "interesado" | "inscrito" | "perdido";

const LEAD_PIPELINE_STORAGE_PREFIX = "skoolia:lead-pipeline";

const STAGE_META: Record<
	LeadStage,
	{ label: string; classes: string; description: string }
> = {
	nuevo: {
		label: "Nuevo",
		classes: "bg-amber-50 text-amber-700",
		description: "Lead recién detectado.",
	},
	contactado: {
		label: "Contactado",
		classes: "bg-sky-50 text-sky-700",
		description: "Ya hubo primer acercamiento.",
	},
	interesado: {
		label: "Interesado",
		classes: "bg-indigo-50 text-indigo-700",
		description: "Mostró interés en oferta académica.",
	},
	inscrito: {
		label: "Inscrito",
		classes: "bg-emerald-50 text-emerald-700",
		description: "Conversión exitosa.",
	},
	perdido: {
		label: "Perdido",
		classes: "bg-slate-100 text-slate-600",
		description: "Lead descartado o inactivo.",
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
	return `${LEAD_PIPELINE_STORAGE_PREFIX}:${ownerId ?? "anon"}`;
}

function readPipeline(ownerId?: string): Record<string, LeadStage> {
	if (typeof window === "undefined") return {};

	try {
		const raw = localStorage.getItem(getStorageKey(ownerId));
		if (!raw) return {};
		return JSON.parse(raw) as Record<string, LeadStage>;
	} catch {
		return {};
	}
}

function writePipeline(pipeline: Record<string, LeadStage>, ownerId?: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(getStorageKey(ownerId), JSON.stringify(pipeline));
}

function inferDefaultStage(thread: SchoolThread): LeadStage {
	if (thread.threadHasUnread) {
		return "nuevo";
	}

	const ageInMs = Date.now() - new Date(thread.lastMessageAt).getTime();
	if (thread.lastSenderRole === "public") {
		return "contactado";
	}

	if (ageInMs <= 7 * 24 * 60 * 60 * 1000) {
		return "interesado";
	}

	return "perdido";
}

export default function SchoolLeadsSection() {
	const { user } = useAuth();
	const [threads, setThreads] = useState<SchoolThread[]>([]);
	const [filter, setFilter] = useState<"today" | "week">("today");
	const [stageFilter, setStageFilter] = useState<LeadStage | "all">("all");
	const [pipeline, setPipeline] = useState<Record<string, LeadStage>>({});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		setPipeline(readPipeline(user?.id));
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

		setPipeline((prev) => {
			let changed = false;
			const next = { ...prev };

			threads.forEach((thread) => {
				if (!next[thread.publicUserId]) {
					next[thread.publicUserId] = inferDefaultStage(thread);
					changed = true;
				}
			});

			if (changed) {
				writePipeline(next, user?.id);
			}

			return changed ? next : prev;
		});
	}, [threads, user?.id]);

	const setLeadStage = (publicUserId: string, stage: LeadStage) => {
		setPipeline((prev) => {
			const next = { ...prev, [publicUserId]: stage };
			writePipeline(next, user?.id);
			return next;
		});
	};

	const stageCounters = useMemo(() => {
		const counters: Record<LeadStage, number> = {
			nuevo: 0,
			contactado: 0,
			interesado: 0,
			inscrito: 0,
			perdido: 0,
		};

		threads.forEach((thread) => {
			const stage = pipeline[thread.publicUserId] ?? inferDefaultStage(thread);
			counters[stage] += 1;
		});

		return counters;
	}, [pipeline, threads]);

	const filteredThreads = useMemo(() => {
		const now = Date.now();
		const threshold = filter === "today" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

		return threads.filter((thread) => {
			const date = new Date(thread.lastMessageAt);
			if (Number.isNaN(date.getTime())) return false;

			const timeMatch = now - date.getTime() <= threshold;
			if (!timeMatch) return false;

			if (stageFilter === "all") return true;

			const stage = pipeline[thread.publicUserId] ?? inferDefaultStage(thread);
			return stage === stageFilter;
		});
	}, [filter, pipeline, stageFilter, threads]);

	return (
		<section className="surface rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
			<header className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
				<div>
					<h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
						Prospectos
					</h2>
					<p className="mt-1 text-xs sm:text-sm text-slate-600">
						Da seguimiento a familias interesadas y conviértelas en inscripciones.
					</p>
				</div>
				<div className="hidden gap-2 sm:flex">
					<button
						type="button"
						onClick={() => setFilter("today")}
						className={`rounded-2xl px-3 py-2 text-xs font-bold ${
							filter === "today"
								? "bg-slate-100 text-slate-700 hover:bg-slate-200"
								: "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
						}`}
					>
						Hoy
					</button>
					<button
						type="button"
						onClick={() => setFilter("week")}
						className={`rounded-2xl px-3 py-2 text-xs font-bold ${
							filter === "week"
								? "bg-slate-100 text-slate-700 hover:bg-slate-200"
								: "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50"
						}`}
					>
						Últimos 7 días
					</button>
				</div>
			</header>

			<div className="grid grid-cols-2 gap-2 border-y border-slate-100/70 bg-slate-50/70 px-5 py-3 sm:grid-cols-5 sm:px-6">
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
							<p className="text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
								{meta.label}
							</p>
							<p className="mt-1 text-base font-extrabold text-slate-900">{stageCounters[stage]}</p>
						</button>
					);
				})}
			</div>

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
					const stage = pipeline[thread.publicUserId] ?? inferDefaultStage(thread);
					const status = STAGE_META[stage];
					const unreadDescription = thread.threadHasUnread
						? `${thread.unreadCount} mensaje${thread.unreadCount === 1 ? "" : "s"} sin leer`
						: status.description;

					return (
						<div
							key={thread.publicUserId}
							className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 hover:bg-slate-50"
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
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] sm:text-xs font-bold ${status.classes}`}>
									{status.label}
								</span>
								<select
									value={stage}
									onChange={(event) =>
										setLeadStage(thread.publicUserId, event.target.value as LeadStage)
									}
									className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-semibold text-slate-700"
								>
									<option value="nuevo">Nuevo</option>
									<option value="contactado">Contactado</option>
									<option value="interesado">Interesado</option>
									<option value="inscrito">Inscrito</option>
									<option value="perdido">Perdido</option>
								</select>
								<div className="flex items-center gap-1 sm:gap-2">
									<Link
										href={`/schools/messages?thread=${thread.publicUserId}`}
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
		</section>
	);
}
