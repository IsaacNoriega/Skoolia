"use client";

import { useState, type JSX } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, CreditCard, ShieldCheck, Zap } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionsService } from "@/lib/services/services/subscriptions.service";

type Feature = {
  label: string;
  highlight?: boolean;
};

type Plan = {
  id: string;
  name: string;
  tagline: string;
  price: string;
  priceSuffix: string;
  icon: JSX.Element;
  popular?: boolean;
  features: Feature[];
};

const plans: Plan[] = [
  {
    id: "freemium",
    name: "Freemium",
    tagline: "Registro gratuito para generar trafico constante.",
    price: "$0",
    priceSuffix: "/mes",
    icon: <CreditCard className="h-6 w-6 text-slate-500" />,
    features: [
      { label: "Listado basico" },
      { label: "Panel de leads" },
      { label: "Mensajeria estandar" },
      { label: "Soporte via ticket" },
    ],
  },
  {
    id: "premium",
    name: "Suscripcion Premium",
    tagline: "Aparicion garantizada en la primera galeria y busquedas top.",
    price: "$1,500",
    priceSuffix: "/mes",
    icon: <Zap className="h-6 w-6 text-amber-400" />,
    popular: true,
    features: [
      { label: "Posicionamiento Top #1", highlight: true },
      { label: "Badge verificado oro" },
      { label: "Analytics en tiempo real" },
      { label: "Consultor IA ilimitado" },
      { label: "Soporte 24/7" },
    ],
  },
  {
    id: "performance",
    name: "Pago por Resultados",
    tagline: "Paga solo por lo que conviertes. Ideal para escalar.",
    price: "Variable",
    priceSuffix: "/mes",
    icon: <ArrowUpRight className="h-6 w-6 text-indigo-500" />,
    features: [
      { label: "Lead por interes ($)" },
      { label: "1% comision por inscripcion" },
      { label: "Acceso a envios masivos" },
      { label: "Integracion CRM avanzada" },
    ],
  },
];

export default function SchoolPlansSection() {
  const router = useRouter();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);

    try {
      const response = await subscriptionsService.upgradeToPremium();

      await refreshUser();
      router.refresh();

      showToast({
        title: "Upgrade completado",
        description:
          response.message || "Tu escuela ahora cuenta con el plan Premium.",
        variant: "success",
      });
    } catch (error) {
      console.error("No se pudo actualizar la suscripcion", error);

      showToast({
        title: "No pudimos procesar el upgrade",
        description:
          error instanceof Error
            ? error.message
            : "Intentalo de nuevo en unos minutos.",
        variant: "error",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          Gestiona el plan de tu escuela
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
          Cada institucion en Skoolia puede tener su propio nivel de visibilidad.
          Elige el que mejor se adapte a tus objetivos de captacion.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isPremium = plan.id === "premium";
          const isDisabled = isUpgrading && isPremium;

          return (
            <article
              key={plan.id}
              className={`relative flex h-full flex-col rounded-[2rem] border border-slate-200/80 bg-white px-6 py-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                plan.popular ? "md:-mt-4 md:pb-8" : ""
              }`}
            >
              {plan.popular ? (
                <div className="absolute inset-x-8 -top-4 flex justify-center">
                  <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                    Mas popular
                  </span>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 shadow-sm">
                  {plan.icon}
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                    {plan.name}
                  </h2>
                  <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
                    {plan.tagline}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  {plan.price}
                  <span className="ml-1 align-middle text-xs font-semibold text-slate-400">
                    {plan.priceSuffix}
                  </span>
                </p>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-slate-700 sm:text-sm">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className={feature.highlight ? "font-bold" : ""}>
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isPremium ? (
                  <button
                    type="button"
                    onClick={handleUpgrade}
                    disabled={isDisabled}
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
                  >
                    {isUpgrading ? "Procesando..." : "Actualizar a Premium"}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:shadow-md sm:text-sm"
                  >
                    {plan.id === "freemium" ? "Plan actual base" : "Contactar ventas"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>

      <section className="surface mt-2 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-slate-200/80 bg-white px-6 py-5 shadow-md sm:flex-row sm:items-center sm:px-8 sm:py-6">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 sm:text-base">
              Facturacion Centralizada
            </h3>
            <p className="mt-1 max-w-xl text-xs text-slate-600 sm:text-sm">
              Gestionamos todos tus pagos en una sola factura mensual, sin
              importar cuantas escuelas manejes. Transparente y sencillo.
            </p>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg sm:text-sm"
        >
          Configurar pagos
        </button>
      </section>
    </div>
  );
}
