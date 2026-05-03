"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
	ArrowUpRight,
	CalendarDays,
	ChevronRight,
	Edit2,
	Percent,
	Plus,
	Trash2,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/toast";

type CouponStatus = "NUEVO" | "ACTIVO" | "EXPIRADO";

type Coupon = {
	id: number;
	name: string;
	code: string;
	status: CouponStatus;
	expiresAt: string;
	usageUsed: number;
	usageLimit: number;
};

const OFFERS_STORAGE_PREFIX = "skoolia:offers";

function getStorageKey(userId?: string) {
	return `${OFFERS_STORAGE_PREFIX}:${userId ?? "anon"}`;
}

function readCoupons(userId?: string): Coupon[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = localStorage.getItem(getStorageKey(userId));
		if (!raw) return [];
		return JSON.parse(raw) as Coupon[];
	} catch {
		return [];
	}
}

function writeCoupons(coupons: Coupon[], userId?: string) {
	if (typeof window === "undefined") return;
	localStorage.setItem(getStorageKey(userId), JSON.stringify(coupons));
}

function getSeedCoupons(): Coupon[] {
	return [
		{
			id: 1,
			name: "Beca 15% primer ingreso",
			code: "NUEVO2026",
			status: "NUEVO",
			expiresAt: "2026-02-15",
			usageUsed: 12,
			usageLimit: 50,
		},
		{
			id: 2,
			name: "Inscripción gratis fútbol",
			code: "GOAL100",
			status: "ACTIVO",
			expiresAt: "2026-02-10",
			usageUsed: 8,
			usageLimit: 10,
		},
		{
			id: 3,
			name: "Pronto pago marzo",
			code: "EARLY24",
			status: "ACTIVO",
			expiresAt: "2026-03-01",
			usageUsed: 45,
			usageLimit: 100,
		},
	];
}

function statusLabel(status: CouponStatus) {
	switch (status) {
		case "NUEVO":
			return "Nuevo";
		case "ACTIVO":
			return "Activo";
		case "EXPIRADO":
		default:
			return "Expirado";
	}
}

function statusDot(status: CouponStatus, isCourseMode: boolean) {
	switch (status) {
		case "NUEVO":
			return isCourseMode ? "bg-violet-600" : "bg-[#1973fd]";
		case "ACTIVO":
			return "bg-slate-950";
		case "EXPIRADO":
		default:
			return "bg-slate-300";
	}
}

function formatExpiry(date: string) {
	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return "Vigencia no definida";
	return parsed.toLocaleDateString("es-MX", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	});
}

export default function SchoolOffersSection() {
	const { user } = useAuth();
	const { showToast } = useToast();
	const pathname = usePathname();
	const isCourseMode = pathname.startsWith("/courses");

	const accentColor = isCourseMode ? "#7c3aed" : "#1973fd";
	const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-[#1973fd]";
	const accentTextClass = isCourseMode ? "text-violet-600" : "text-[#1973fd]";
	const accentLightBgClass = isCourseMode ? "bg-violet-600/10" : "bg-[#1973fd]/10";
	const accentLightTextClass = isCourseMode ? "text-violet-600" : "text-[#1973fd]";
	const accentBorderLightClass = isCourseMode ? "bg-violet-600/8" : "bg-[#1973fd]/8";


	const [coupons, setCoupons] = useState<Coupon[]>(() => {
		const existing = readCoupons(user?.id);
		const initialCoupons = existing.length ? existing : getSeedCoupons();

		if (!existing.length) {
			writeCoupons(initialCoupons, user?.id);
		}

		return initialCoupons;
	});
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [usageLimit, setUsageLimit] = useState("100");

	const metrics = useMemo(() => {
		const totalUsage = coupons.reduce((sum, coupon) => sum + coupon.usageUsed, 0);
		const activeCount = coupons.filter((coupon) => coupon.status === "ACTIVO").length;
		const totalDiscountEstimate = coupons.reduce(
			(sum, coupon) => sum + coupon.usageUsed * 350,
			0,
		);

		return {
			totalUsage,
			activeCount,
			totalDiscountEstimate,
		};
	}, [coupons]);

	const persistCoupons = (next: Coupon[]) => {
		setCoupons(next);
		writeCoupons(next, user?.id);
	};

	const createCoupon = () => {
		const normalizedName = name.trim();
		const normalizedCode = code.trim().toUpperCase();
		const normalizedLimit = Number(usageLimit);

		if (!normalizedName || !normalizedCode || !expiresAt || !Number.isFinite(normalizedLimit)) {
			showToast({
				title: "Faltan datos del cupón",
				description: "Completa nombre, código, vigencia y cupo.",
				variant: "error",
			});
			return;
		}

		if (normalizedLimit <= 0) {
			showToast({
				title: "Cupo inválido",
				description: "El límite de uso debe ser mayor a cero.",
				variant: "error",
			});
			return;
		}

		const duplicated = coupons.some((coupon) => coupon.code === normalizedCode);
		if (duplicated) {
			showToast({
				title: "Código duplicado",
				description: "Usa un código distinto para esta promoción.",
				variant: "error",
			});
			return;
		}

		const nextCoupon: Coupon = {
			id: Date.now(),
			name: normalizedName,
			code: normalizedCode,
			status: "NUEVO",
			expiresAt,
			usageUsed: 0,
			usageLimit: normalizedLimit,
		};

		persistCoupons([nextCoupon, ...coupons]);
		setName("");
		setCode("");
		setExpiresAt("");
		setUsageLimit("100");
		setShowForm(false);

		showToast({
			title: "Cupón creado",
			description: "Tu promoción ya está lista para activarse.",
			variant: "success",
		});
	};

	const toggleStatus = (id: number) => {
		const next = coupons.map((coupon) => {
			if (coupon.id !== id) return coupon;
			if (coupon.status === "EXPIRADO") return coupon;

			return {
				...coupon,
				status: coupon.status === "ACTIVO" ? "NUEVO" : "ACTIVO",
			};
		});

		persistCoupons(next);
	};

	const removeCoupon = (id: number) => {
		persistCoupons(coupons.filter((coupon) => coupon.id !== id));
		showToast({
			title: "Cupón eliminado",
			description: "La promoción fue removida correctamente.",
			variant: "info",
		});
	};

	return (
		<section className="rounded-[2rem] border border-slate-200 bg-white">
			<div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_380px]">
				<div className="border-b border-slate-200 p-6 sm:p-8 lg:border-b-0 lg:border-r">
					<div className="flex items-start justify-between gap-4">
						<div>
							<p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
								Ofertas
							</p>
							<h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
								Descuentos claros.
							</h1>
							<p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
								Crea promociones sin sobrecargar la operación. Un código, una vigencia y un cupo visible.
							</p>
						</div>
						<button
							onClick={() => setShowForm((prev) => !prev)}
							className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-950 transition hover:border-slate-300 hover:bg-slate-50"
						>
							<Plus size={16} />
							{showForm ? "Cerrar" : "Nuevo"}
						</button>
					</div>

					<div className="mt-8 grid gap-3 sm:grid-cols-3">
						<Metric label="Cupones activos" value={`${metrics.activeCount}`} accentColorClass={accentTextClass} />
						<Metric label="Usos totales" value={`${metrics.totalUsage}`} accent accentColorClass={accentTextClass} />
						<Metric
							label="Descuento estimado"
							value={`$${(metrics.totalDiscountEstimate / 1000).toFixed(1)}k`}
							accentColorClass={accentTextClass}
						/>
					</div>

					{showForm ? (
						<div className="mt-8 rounded-[1.5rem] border border-slate-200 p-5">
							<p className="text-sm font-semibold text-slate-950">
								Nueva promoción
							</p>
							<div className="mt-5 grid gap-3 sm:grid-cols-2">
								<input
									value={name}
									onChange={(event) => setName(event.target.value)}
									placeholder="Nombre del cupón"
									className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300"
								/>
								<input
									value={code}
									onChange={(event) => setCode(event.target.value)}
									placeholder="Código"
									className="h-12 rounded-2xl border border-slate-200 px-4 text-sm uppercase text-slate-950 outline-none transition focus:border-slate-300"
								/>
								<input
									type="date"
									value={expiresAt}
									onChange={(event) => setExpiresAt(event.target.value)}
									className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300"
								/>
								<input
									type="number"
									value={usageLimit}
									onChange={(event) => setUsageLimit(event.target.value)}
									min={1}
									placeholder="Cupo máximo"
									className="h-12 rounded-2xl border border-slate-200 px-4 text-sm text-slate-950 outline-none transition focus:border-slate-300"
								/>
							</div>
							<div className="mt-4 flex justify-end">
								<button
									onClick={createCoupon}
									className="inline-flex h-11 items-center rounded-2xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
								>
									Guardar cupón
								</button>
							</div>
						</div>
					) : null}

					<div className="mt-8">
						<div className="flex items-center justify-between">
							<p className="text-sm font-semibold text-slate-950">
								Cupones
							</p>
							<p className="text-sm text-slate-500">{coupons.length} registrados</p>
						</div>

						<div className="mt-4 space-y-3">
							{coupons.map((coupon) => (
								<div
									key={coupon.id}
									className="rounded-[1.5rem] border border-slate-200 px-4 py-4 transition hover:border-slate-300"
								>
									<div className="flex items-start justify-between gap-4">
										<div className="min-w-0">
											<div className="flex items-center gap-2">
												<span className={`h-2 w-2 rounded-full ${statusDot(coupon.status, isCourseMode)}`} />
												<span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
													{statusLabel(coupon.status)}
												</span>
											</div>
											<p className="mt-3 truncate text-sm font-semibold text-slate-950">
												{coupon.name}
											</p>
											<div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
												<span className={`rounded-full ${accentBorderLightClass} px-3 py-1 ${accentLightTextClass}`}>
													{coupon.code}
												</span>
												<span>Vence {formatExpiry(coupon.expiresAt)}</span>
											</div>
										</div>

										<div className="flex items-center gap-2">
											<button
												onClick={() => toggleStatus(coupon.id)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
												aria-label="Editar estado"
											>
												<Edit2 size={14} />
											</button>
											<button
												onClick={() => removeCoupon(coupon.id)}
												className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
												aria-label="Eliminar cupón"
											>
												<Trash2 size={14} />
											</button>
										</div>
									</div>

									<div className="mt-4">
										<div className="flex items-center justify-between text-xs font-medium text-slate-400">
											<span>Uso</span>
											<span>
												{coupon.usageUsed}/{coupon.usageLimit}
											</span>
										</div>
										<div className="mt-2 h-1.5 rounded-full bg-slate-100">
											<div
												className={`h-1.5 rounded-full ${accentBgClass}`}
												style={{
													width: `${Math.min((coupon.usageUsed / coupon.usageLimit) * 100, 100)}%`,
												}}
											/>
										</div>
									</div>
								</div>
							))}

							{!coupons.length ? (
								<div className="rounded-[1.5rem] border border-dashed border-slate-200 px-4 py-8 text-sm text-slate-500">
									Aún no tienes promociones creadas.
								</div>
							) : null}
						</div>
					</div>
				</div>

				<aside className="p-6 sm:p-8">
					<div>
						<p className="text-sm font-semibold text-slate-950">Resumen</p>
						<p className="mt-1 text-sm text-slate-500">
							Estado actual de tus promociones.
						</p>
					</div>

					<div className="mt-6 rounded-[1.5rem] bg-slate-50 p-5">
						<div className="flex items-center gap-3">
							<div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accentLightBgClass} ${accentLightTextClass}`}>
								<Percent size={18} />
							</div>
							<div>
								<p className="text-sm font-semibold text-slate-950">
									Promoción destacada
								</p>
								<p className="text-sm text-slate-500">
									Mayor uso reciente
								</p>
							</div>
						</div>
						<p className="mt-5 text-lg font-semibold text-slate-950">
							{coupons[0]?.name ?? "Sin promociones"}
						</p>
						<p className="mt-1 text-sm text-slate-500">
							{coupons[0]?.code ? `Código ${coupons[0].code}` : "Crea tu primer cupón"}
						</p>
					</div>

					<div className="mt-6 space-y-4">
						<InfoRow icon={CalendarDays} label="Próxima vigencia" value={coupons[0] ? formatExpiry(coupons[0].expiresAt) : "Sin fecha"} accentColorClass={accentTextClass} />
						<InfoRow icon={ArrowUpRight} label="Conversión estimada" value="12%" accent accentColorClass={accentTextClass} />
						<InfoRow icon={ChevronRight} label="Promociones nuevas" value={`${coupons.filter((coupon) => coupon.status === "NUEVO").length}`} accentColorClass={accentTextClass} />
					</div>
				</aside>
			</div>
		</section>
	);
}

function Metric({
	label,
	value,
	accent = false,
	accentColorClass = "text-[#1973fd]",
}: {
	label: string;
	value: string;
	accent?: boolean;
	accentColorClass?: string;
}) {
	return (
		<div className="rounded-2xl bg-slate-50 px-4 py-4">
			<p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
				{label}
			</p>
			<p className={`mt-3 text-2xl font-semibold ${accent ? accentColorClass : "text-slate-950"}`}>
				{value}
			</p>
		</div>
	);
}

function InfoRow({
	icon: Icon,
	label,
	value,
	accent = false,
	accentColorClass = "text-[#1973fd]",
}: {
	icon: typeof CalendarDays;
	label: string;
	value: string;
	accent?: boolean;
	accentColorClass?: string;
}) {
	return (
		<div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
			<div className="flex items-center gap-3">
				<Icon size={16} className={accent ? accentColorClass : "text-slate-400"} />
				<span className="text-sm text-slate-500">{label}</span>
			</div>
			<span className="text-sm font-semibold text-slate-950">{value}</span>
		</div>
	);
}
