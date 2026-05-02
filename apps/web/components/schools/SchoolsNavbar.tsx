"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, PlusCircle, Search, UserCircle2, Zap } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { schoolsService } from "@/lib/services/services/schools.service";

import RegisterProjectModal from "./RegisterProjectModal";
import SchoolRegistrationWizard from "./SchoolRegistrationWizard";

export default function SchoolsNavbar() {
	const router = useRouter();
	const pathname = usePathname();
	const { user } = useAuth();
	const [registerOpen, setRegisterOpen] = useState(false);
	const [wizardOpen, setWizardOpen] = useState(false);
	const [schoolName, setSchoolName] = useState<string | null>(null);
	const [hasSchool, setHasSchool] = useState(false);

	const sectionTitles: Record<string, { title: string; description: string }> = {
		"/schools": {
			title: "Vista general",
			description: "Resumen operativo de tu panel escolar.",
		},
		"/schools/courses": {
			title: "Oferta académica",
			description: "Programas, modalidades y cupos publicados.",
		},
		"/courses": {
			title: "Vista general",
			description: "Resumen operativo de tu panel de instructor.",
		},
		"/courses/academic": {
			title: "Mis cursos",
			description: "Gestiona tus cursos particulares y programas.",
		},
		"/schools/leads": {
			title: "Prospectos",
			description: "Seguimiento de leads y oportunidades activas.",
		},
		"/courses/leads": {
			title: "Prospectos",
			description: "Personas interesadas en tus cursos.",
		},
		"/schools/messages": {
			title: "Mensajería",
			description: "Conversaciones recientes con familias y prospectos.",
		},
		"/courses/messages": {
			title: "Mensajería",
			description: "Conversaciones con tus alumnos e interesados.",
		},
		"/schools/broadcasts": {
			title: "Envíos masivos",
			description: "Campañas y comunicación de alcance amplio.",
		},
		"/courses/broadcasts": {
			title: "Envíos masivos",
			description: "Notificaciones masivas a tus alumnos.",
		},
		"/schools/offers": {
			title: "Ofertas y promos",
			description: "Promociones activas y campañas comerciales.",
		},
		"/courses/offer": {
			title: "Ofertas y promos",
			description: "Tus promociones vigentes.",
		},
		"/schools/plans": {
			title: "Planes y pagos",
			description: "Suscripción, facturación y estado del plan.",
		},
		"/courses/plans": {
			title: "Planes y pagos",
			description: "Tu suscripción de instructor.",
		},
		"/schools/settings": {
			title: "Configuración",
			description: "Preferencias, datos base y ajustes del panel.",
		},
		"/courses/settings": {
			title: "Configuración",
			description: "Ajustes de tu perfil de instructor.",
		},
	};

	const currentSection = sectionTitles[pathname] ?? sectionTitles["/schools"];
	const isCourseMode = pathname.startsWith("/courses");
	const accentBg = isCourseMode ? "bg-violet-600" : "bg-blue-600";
	const accentHoverBg = isCourseMode ? "hover:bg-violet-700" : "hover:bg-blue-700";

	useEffect(() => {
		let active = true;

		(async () => {
			try {
				if (isCourseMode) {
					// En modo curso independiente, quizás no mostramos nombre de escuela
					if (active) setSchoolName(null);
					return;
				}
				const school = await schoolsService.getMySchool();
				if (active) {
					setSchoolName(school?.name ?? null);
					setHasSchool(Boolean(school?.id));
				}
			} catch {
				if (active) {
					setHasSchool(false);
				}
			}
		})();

		return () => {
			active = false;
		};
	}, [isCourseMode]);

	return (
		<>
			<header className="h-full border-b border-slate-200 bg-white">
				<div className="flex h-full items-center">
					<div className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
						<div className="flex min-w-0 flex-1 items-center gap-4">
							<div className="flex h-12 w-full max-w-md items-center gap-3 rounded-full border border-slate-200 bg-[#f8f8f4] px-4 text-slate-400">
								<Search size={18} />
								<input
									type="text"
									placeholder={`Buscar en ${currentSection.title.toLowerCase()}`}
									className="h-full w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
								/>
							</div>
							<div className="hidden min-w-0 xl:block">
								<p className="text-sm font-semibold text-slate-900">
									{schoolName || (isCourseMode ? "Instructor Independiente" : "Mi escuela")}
								</p>
								<p className="truncate text-xs text-slate-500">
									{currentSection.title}
								</p>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="hidden items-center gap-4 lg:flex">
								<div className="flex items-center gap-1 text-sm font-semibold text-slate-500">
									<Zap size={16} className="text-slate-400" />
									<span>0</span>
								</div>
								<button
									type="button"
									className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100"
									aria-label="Notificaciones"
								>
									<Bell size={18} />
								</button>
							</div>
							<button
								onClick={() => setRegisterOpen(true)}
								className={`inline-flex items-center gap-2 rounded-lg ${accentBg} px-4 py-2.5 text-sm font-semibold text-white transition ${accentHoverBg}`}
							>
								<PlusCircle size={16} />
								<span>Registrar proyecto</span>
							</button>
							<div className="flex min-w-0 items-center gap-3 rounded-full py-1 pl-2 pr-1.5">
								<div className="hidden min-w-0 text-right sm:block">
									<p className="truncate text-sm font-semibold text-slate-900">
										{user?.name ?? schoolName ?? "Usuario"}
									</p>
									<p className="truncate text-xs text-slate-500">
										{user?.email ?? "sin correo"}
									</p>
								</div>
								<div className={`flex h-11 w-11 items-center justify-center rounded-full ${accentBg} text-white`}>
									{user?.name?.charAt(0)?.toUpperCase() ??
										user?.email?.charAt(0)?.toUpperCase() ?? (
											<UserCircle2 size={20} />
										)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</header>
			<RegisterProjectModal
				isOpen={registerOpen}
				onClose={() => setRegisterOpen(false)}
				onSelectType={(type) => {
					if (type === "school") {
						setWizardOpen(true);
						return;
					}

					if (type === "course") {
						if (!hasSchool) {
							setWizardOpen(true);
							return;
						}

						router.push("/schools/courses?create=1");
					}
				}}
			/>
			<SchoolRegistrationWizard
				isOpen={wizardOpen}
				onClose={() => setWizardOpen(false)}
			/>
		</>
	);
}
