import Link from "next/link";
import { ArrowRight, BookOpen, LifeBuoy, Search, ShieldCheck } from "lucide-react";

const blocks = [
  {
    title: "Explorar escuelas",
    description: "Busca instituciones y cursos desde un solo lugar con filtros simples.",
    href: "/search?tab=escuelas",
    icon: Search,
  },
  {
    title: "Crear cuenta",
    description: "Regístrate como padre o como escuela para desbloquear más funciones.",
    href: "/auth/register",
    icon: BookOpen,
  },
  {
    title: "Acceso para escuelas",
    description: "Ingresa a tu panel para gestionar cursos, leads, campañas y configuración.",
    href: "/auth/login/schools",
    icon: LifeBuoy,
  },
  {
    title: "Privacidad y uso",
    description: "Consulta la información general de uso, cookies y tratamiento de datos.",
    href: "/auth/register",
    icon: ShieldCheck,
  },
];

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-[#f6f8fc] px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-slate-200 bg-white px-8 py-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:px-12 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#1973FC]">
            Centro de ayuda
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Navega Skoolia con rutas claras y accesos directos.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
            Este espacio reúne los accesos más útiles mientras consolidamos la documentación pública.
            Si llegaste desde un enlace del footer o del registro, aquí tienes el siguiente paso correcto.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {blocks.map(({ title, description, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/70 px-5 py-5 transition hover:border-slate-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#1973FC] shadow-sm">
                    <Icon size={18} />
                  </div>
                  <ArrowRight size={18} className="mt-1 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
                </div>
                <h2 className="mt-5 text-lg font-semibold text-slate-950">{title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
