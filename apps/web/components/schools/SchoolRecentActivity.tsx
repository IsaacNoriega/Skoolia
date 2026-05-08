"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

const items = [
	{
		id: 1,
		name: "Juan Delgado",
		info: "Interesado en Primaria Bilingüe",
		ago: "Hace 2h",
		initials: "JD",
	},
	{
		id: 2,
		name: "María Pérez",
		info: "Solicitó información de Secundaria",
		ago: "Hace 3h",
		initials: "MP",
	},
	{
		id: 3,
		name: "Ana Ríos",
		info: "Visitó la ficha de Bachillerato",
		ago: "Hace 4h",
		initials: "AR",
	},
];

export default function SchoolRecentActivity() {
	const pathname = usePathname();
	const isCourseMode = pathname.startsWith("/courses");
	const leadsHref = isCourseMode ? "/courses/leads" : "/schools/leads";

	return (
		<section className="surface rounded-4xl bg-white p-0 shadow-sm ring-1 ring-black/5 overflow-hidden">
			<div className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5">
				<div>
					<h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
						Actividad Reciente
					</h2>
					<p className="mt-1 text-xs sm:text-sm text-slate-600">
						Últimas familias y prospectos que interactuaron con tu institución.
					</p>
				</div>
				<Link href={leadsHref} className="text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700">
					Ver todos
				</Link>
			</div>

			<div className="divide-y divide-slate-100/70">
				{items.map((item) => (
					<div
						key={item.id}
						className="flex items-center justify-between px-5 py-4 sm:px-6 sm:py-5 hover:bg-slate-50"
					>
						<div className="flex items-center gap-3 sm:gap-4">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-700">
								{item.initials}
							</div>
							<div>
								<p className="text-sm sm:text-base font-extrabold text-slate-900">
									{item.name}
								</p>
								<p className="text-xs sm:text-sm text-slate-600">
									{item.info}
								</p>
								<p className="mt-1 text-[10px] sm:text-[11px] font-bold text-slate-400">
									{item.ago}
								</p>
							</div>
						</div>
						<span className="inline-flex items-center rounded-xl bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700 sm:text-xs">
							<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
							Nuevo prospecto
							<ChevronRight size={14} className="ml-1" />
						</span>
					</div>
				))}
			</div>
		</section>
	);
}
