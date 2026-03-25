"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Percent, TicketPercent, Trash2, TrendingUp } from "lucide-react";

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
			name: "Beca 15% Primer Ingreso",
			code: "NUEVO2026",
			status: "NUEVO",
			expiresAt: "2026-02-15",
			usageUsed: 12,
			usageLimit: 50,
		},
		{
			id: 2,
			name: "Inscripción Gratis (Fútbol)",
			code: "GOAL100",
			status: "ACTIVO",
			expiresAt: "2026-02-10",
			usageUsed: 8,
			usageLimit: 10,
		},
		{
			id: 3,
			name: "Pronto Pago Marzo",
			code: "EARLY24",
			status: "ACTIVO",
			expiresAt: "2026-03-01",
			usageUsed: 45,
			usageLimit: 100,
		},
	];
}

function statusClasses(status: CouponStatus) {
	switch (status) {
		case "NUEVO":
			return "bg-emerald-50 text-emerald-700";
		case "ACTIVO":
			return "bg-indigo-50 text-indigo-700";
		case "EXPIRADO":
		default:
			return "bg-slate-100 text-slate-600";
	}
}

export default function SchoolOffersSection() {
	const { user } = useAuth();
	const { showToast } = useToast();

	const [coupons, setCoupons] = useState<Coupon[]>([]);
	const [showForm, setShowForm] = useState(false);
	const [name, setName] = useState("");
	const [code, setCode] = useState("");
	const [expiresAt, setExpiresAt] = useState("");
	const [usageLimit, setUsageLimit] = useState("100");

	useEffect(() => {
		const existing = readCoupons(user?.id);

		if (existing.length) {
			setCoupons(existing);
			return;
		}

		const seeded = getSeedCoupons();
		setCoupons(seeded);
		writeCoupons(seeded, user?.id);
	}, [user?.id]);

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

	const formatExpiry = (date: string) => {
		const parsed = new Date(date);
		if (Number.isNaN(parsed.getTime())) return "Vigencia no definida";
		return `Vence: ${parsed.toLocaleDateString("es-MX", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		})}`;
	};

	return (
		<div className="space-y-5 sm:space-y-6">
			{/* Header principal */}
			<section className="surface flex flex-col justify-between gap-4 rounded-4xl bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-6 sm:py-6 shadow-sm ring-1 ring-black/5">
				<div className="flex items-start gap-4">
					<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
						<TicketPercent size={20} />
					</div>
					<div>
						<h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
							Ofertas & Promociones
						</h2>
						<p className="mt-1 text-xs sm:text-sm text-slate-600">
							Incentiva a los padres con descuentos exclusivos.
						</p>
					</div>
				</div>
				<button
					onClick={() => setShowForm((prev) => !prev)}
					className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow hover:bg-indigo-700"
				>
					<span className="text-base leading-none">+</span>
					<span>{showForm ? "Cerrar" : "Crear cupón"}</span>
				</button>
			</section>

			{showForm ? (
				<section className="surface rounded-4xl bg-white px-5 py-5 shadow-sm ring-1 ring-black/5 sm:px-6">
					<h3 className="text-sm font-extrabold text-slate-900 sm:text-base">Nueva promoción</h3>
					<div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
						<input
							value={name}
							onChange={(event) => setName(event.target.value)}
							placeholder="Nombre del cupón"
							className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
						/>
						<input
							value={code}
							onChange={(event) => setCode(event.target.value)}
							placeholder="Código (ej. BECA2026)"
							className="rounded-2xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-indigo-300"
						/>
						<input
							type="date"
							value={expiresAt}
							onChange={(event) => setExpiresAt(event.target.value)}
							className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
						/>
						<input
							type="number"
							value={usageLimit}
							onChange={(event) => setUsageLimit(event.target.value)}
							min={1}
							placeholder="Cupo máximo"
							className="rounded-2xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-300"
						/>
					</div>
					<div className="mt-4 flex justify-end">
						<button
							onClick={createCoupon}
							className="rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700"
						>
							Guardar cupón
						</button>
					</div>
				</section>
			) : null}

			{/* KPIs */}
			<section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
				<div className="surface rounded-3xl bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm ring-1 ring-black/5">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
						Uso de cupones
					</p>
					<p className="mt-3 text-2xl font-extrabold text-slate-900">{metrics.totalUsage}</p>
				</div>
				<div className="surface flex items-start justify-between rounded-3xl bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm ring-1 ring-black/5">
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
							Ahorro generado
						</p>
						<p className="mt-3 text-2xl font-extrabold text-slate-900">
							${(metrics.totalDiscountEstimate / 1000).toFixed(1)}k
						</p>
					</div>
					<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
						<TrendingUp size={18} />
					</div>
				</div>
				<div className="surface rounded-3xl bg-white px-5 py-4 sm:px-6 sm:py-5 shadow-sm ring-1 ring-black/5">
					<p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
						Cupones activos
					</p>
					<p className="mt-3 text-2xl font-extrabold text-slate-900">{metrics.activeCount}</p>
				</div>
			</section>

			{/* Lista de cupones */}
			<section className="surface rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
				<header className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100/70">
					<h3 className="text-sm sm:text-base font-extrabold text-slate-900">
						Gestionar Cupones
					</h3>
				</header>
				<div className="divide-y divide-slate-100/70">
					{coupons.map((c) => (
						<div
							key={c.id}
							className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-4 hover:bg-slate-50"
						>
							<div className="flex items-center gap-3 sm:gap-4">
								<div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
									<Percent size={16} />
								</div>
								<div>
									<p className="text-sm sm:text-base font-extrabold text-slate-900">
										{c.name}
									</p>
									<div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] sm:text-[11px] font-bold text-slate-500">
										<span className={`inline-flex items-center rounded-full px-3 py-1 ${statusClasses(c.status)}`}>
											{c.status}
										</span>
										<span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold text-white">
											{c.code}
										</span>
										<span className="text-slate-400">{formatExpiry(c.expiresAt)}</span>
									</div>
								</div>
							</div>
							<div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
								<div className="w-full max-w-xs">
									<div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
										<span>Uso</span>
										<span>{c.usageUsed}/{c.usageLimit}</span>
									</div>
									<div className="mt-1 h-1.5 rounded-full bg-slate-100">
										<div
											className="h-1.5 rounded-full bg-violet-600"
											style={{ width: `${Math.min((c.usageUsed / c.usageLimit) * 100, 100)}%` }}
										/>
									</div>
								</div>
								<div className="flex items-center gap-2">
									<button
										onClick={() => toggleStatus(c.id)}
										className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
										aria-label="Activar o pausar cupón"
									>
										<Edit2 size={14} />
									</button>
									<button
										onClick={() => removeCoupon(c.id)}
										className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
										aria-label="Eliminar cupón"
									>
										<Trash2 size={14} />
									</button>
								</div>
							</div>
						</div>
					))}

					{!coupons.length ? (
						<div className="px-5 py-8 text-sm text-slate-500 sm:px-6">
							Aún no tienes promociones. Crea tu primer cupón para activar campañas comerciales.
						</div>
					) : null}
				</div>
			</section>
		</div>
	);
}
