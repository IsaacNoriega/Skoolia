"use client";

import { usePathname, useRouter } from "next/navigation";
import {
	ArrowUpRight,
	CalendarDays,
	ChevronRight,
	Clock3,
	Mail,
	Send,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { subscriptionsService, type SchoolActivePlan } from "@/lib/services/services/subscriptions.service";
import { FeatureLock } from "./FeatureLock";

type CampaignStatus = "PROGRAMADA" | "ENVIADA" | "BORRADOR";

type Campaign = {
	id: number;
	name: string;
	segment: string;
	sent: string;
	status: CampaignStatus;
	date: string;
};

const campaigns: Campaign[] = [
	{
		id: 1,
		name: "Open House Febrero",
		segment: "Leads interesados en Primaria",
		sent: "428 contactos",
		status: "ENVIADA",
		date: "31 ene 2026",
	},
	{
		id: 2,
		name: "Recordatorio Becas 2026",
		segment: "Todos los leads activos",
		sent: "312 contactos",
		status: "PROGRAMADA",
		date: "Hoy · 6:00 PM",
	},
	{
		id: 3,
		name: "Campaña Primavera",
		segment: "Leads fríos del último año",
		sent: "154 contactos",
		status: "BORRADOR",
		date: "Sin programar",
	},
];

function statusLabel(status: CampaignStatus) {
	switch (status) {
		case "PROGRAMADA":
			return "Programada";
		case "ENVIADA":
			return "Enviada";
		case "BORRADOR":
		default:
			return "Borrador";
	}
}

function statusDot(status: CampaignStatus) {
	switch (status) {
		case "PROGRAMADA":
			return "bg-amber-500";
		case "ENVIADA":
			return "bg-emerald-500";
		case "BORRADOR":
		default:
			return "bg-slate-300";
	}
}

export default function SchoolBroadcastsSection() {
	const pathname = usePathname();
	const router = useRouter();
	const [activePlans, setActivePlans] = useState<SchoolActivePlan[]>([]);
	const [loading, setLoading] = useState(true);

	const isCourseMode = pathname.startsWith("/courses");
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-slate-950";
	const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-slate-800";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-slate-950";
	const basePath = isCourseMode ? "/courses" : "/schools";

	useEffect(() => {
		(async () => {
			try {
				const plans = await subscriptionsService.getActivePlans();
				setActivePlans(plans);
			} finally {
				setLoading(false);
			}
		})();
	}, []);

	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-950" />
			</div>
		);
	}

	const hasAddon = activePlans.some(p => p.plan.name === "MASS_MESSAGE");

	if (!hasAddon) {
		return (
			<FeatureLock
				title="Envíos Masivos"
				description="Comunícate con todos tus prospectos de forma masiva a través de email y notificaciones. Requiere el servicio de Mensajería Masiva."
				requiredPlan="Mensajes Masivos"
			/>
		);
	}

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white">
			<div className="grid gap-0 lg:grid-cols-[minmax(0,1.2fr)_380px]">
				<div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.08),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-6 sm:p-8 lg:border-b-0 lg:border-r">
					<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
						Envíos masivos
					</p>
					<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
						Mensajes masivos con menos fricción.
					</h1>
					<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
						Prepara campañas rápidas, filtra por segmento y salta al seguimiento sin perder de vista rendimiento, alcance y estado.
					</p>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						<StatTile label="Activas" value="02" />
						<StatTile label="Contactos" value="740" />
						<StatTile label="Apertura" value="64%" />
					</div>

					<div className="mt-8 space-y-5">
						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Asunto
							</label>
							<input
								type="text"
								defaultValue="Open House Febrero"
								className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300"
							/>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							<div className="space-y-2">
								<label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
									Segmento
								</label>
								<div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm text-slate-950">
									<span>Leads activos</span>
									<Users size={16} className="text-slate-400" />
								</div>
							</div>

							<div className="space-y-2">
								<label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
									Canal
								</label>
								<div className="flex h-12 items-center justify-between rounded-2xl border border-slate-200 px-4 text-sm text-slate-950">
									<span>Email</span>
									<Mail size={16} className="text-slate-400" />
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<label className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
								Mensaje
							</label>
							<textarea
								rows={8}
								defaultValue="Hola, queremos invitarte a nuestro Open House de febrero. Podrás conocer instalaciones, horarios y el plan académico."
								className="w-full resize-none rounded-[1.5rem] border border-slate-200 bg-white px-4 py-4 text-sm leading-7 text-slate-950 outline-none transition focus:border-slate-300"
							/>
						</div>

						<div className="flex flex-wrap items-center gap-3">
							<button
								type="button"
								onClick={() => router.push(`${basePath}/messages`)}
								className={`inline-flex h-12 items-center gap-2 rounded-2xl ${accentBgClass} px-5 text-sm font-semibold text-white transition ${accentHoverBgClass}`}
							>
								<Send size={16} />
								Ir a mensajería
							</button>
							<button
								type="button"
								onClick={() => router.push(`${basePath}/leads`)}
								className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
							>
								<CalendarDays size={16} />
								Ver segmentos
							</button>
						</div>
					</div>
				</div>

				<aside className="p-6 sm:p-8">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm font-semibold text-slate-950">Historial</p>
							<p className="mt-1 text-sm text-slate-500">
								Últimas campañas.
							</p>
						</div>
						<button
							type="button"
							onClick={() => router.push(`${basePath}/messages`)}
							className="text-sm font-semibold text-slate-500 transition hover:text-slate-950"
						>
							Ver todo
						</button>
					</div>

					<div className="mt-6 space-y-3">
						{campaigns.map((campaign) => (
							<button
								key={campaign.id}
								type="button"
								onClick={() => router.push(`${basePath}/messages`)}
								className="flex w-full items-start justify-between rounded-[1.5rem] border border-slate-200 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
							>
								<div className="min-w-0">
									<div className="flex items-center gap-2">
										<span className={`h-2 w-2 rounded-full ${statusDot(campaign.status)}`} />
										<span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
											{statusLabel(campaign.status)}
										</span>
									</div>
									<p className="mt-3 truncate text-sm font-semibold text-slate-950">
										{campaign.name}
									</p>
									<p className="mt-1 text-sm text-slate-500">
										{campaign.segment}
									</p>
									<div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-400">
										<span className="inline-flex items-center gap-1.5">
											<Users size={14} />
											{campaign.sent}
										</span>
										<span className="inline-flex items-center gap-1.5">
											<Clock3 size={14} />
											{campaign.date}
										</span>
									</div>
								</div>
								<ChevronRight size={18} className="ml-4 shrink-0 text-slate-300" />
							</button>
						))}
					</div>

					<div className="mt-8 rounded-[1.5rem] bg-slate-50 p-5">
						<p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
							Resumen
						</p>
						<div className="mt-4 space-y-3">
							<StatLine label="Campañas activas" value="02" />
							<StatLine label="Contactos alcanzados" value="740" />
							<StatLine label="Última apertura" value="64%" />
						</div>
						<div className={`mt-5 inline-flex items-center gap-2 text-sm font-semibold ${accentTextClass}`}>
							<button
								type="button"
								onClick={() => router.push(`${basePath}/leads`)}
								className="inline-flex items-center gap-2"
							>
								Ver rendimiento
								<ArrowUpRight size={16} />
							</button>
						</div>
					</div>
				</aside>
			</div>
		</section>
	);
}

function StatLine({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex items-center justify-between text-sm">
			<span className="text-slate-500">{label}</span>
			<span className="font-semibold text-slate-950">{value}</span>
		</div>
	);
}

function StatTile({ label, value }: { label: string; value: string }) {
	return (
		<div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
			<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
				{label}
			</p>
			<p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
		</div>
	);
}
