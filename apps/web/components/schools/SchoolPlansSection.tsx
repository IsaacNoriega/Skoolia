"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, CreditCard, ShieldCheck, Zap, Loader2, Users, MessageSquare, CheckCircle, Sparkles } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionsService, type SchoolActivePlan } from "@/lib/services/services/subscriptions.service";
import { plansService, type Plan } from "@/lib/services/services/plans.service";

export default function SchoolPlansSection() {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const [isUpgrading, setIsUpgrading] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<Plan[]>([]);
  const [addonPlans, setAddonPlans] = useState<Plan[]>([]);
  const [activePlans, setActivePlans] = useState<SchoolActivePlan[]>([]);
  const [loading, setLoading] = useState(true);

  const isCourseMode = pathname.startsWith("/courses");
  const accentTextClass = isCourseMode ? "text-violet-600" : "text-indigo-600";
  const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
  const accentLightBgClass = isCourseMode ? "bg-violet-50" : "bg-indigo-50";
  const accentBorderClass = isCourseMode ? "border-violet-200" : "border-indigo-200";
  const accentRingClass = isCourseMode ? "ring-violet-500" : "ring-indigo-500";
  const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";
  const settingsHref = isCourseMode ? "/courses/settings" : "/schools/settings";


  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [fetchedPlans, fetchedActivePlans] = await Promise.all([
          plansService.getAll(),
          subscriptionsService.getActivePlans().catch(() => []),
        ]);
        if (mounted) {
          setSubscriptionPlans(fetchedPlans.filter(p => p.type === "subscription"));
          setAddonPlans(fetchedPlans.filter(p => p.type === "lead"));
          setActivePlans(fetchedActivePlans);
        }
      } catch (error) {
        if (mounted) {
          showToast({ title: "Error", description: "No se pudieron cargar los planes", variant: "error" });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => { mounted = false; };
  }, [showToast]);

  const handleUpgrade = async (planId: string) => {
    setIsUpgrading(planId);

    try {
      const response = await subscriptionsService.changePlan(planId);

      await refreshUser();
      const updatedPlans = await subscriptionsService.getActivePlans();
      setActivePlans(updatedPlans);
      router.refresh();

      showToast({
        title: "Plan actualizado",
        description: response.message || "Tu escuela ha cambiado de plan con éxito.",
        variant: "success",
      });
    } catch (error) {
      console.error("No se pudo actualizar la suscripcion", error);

      showToast({
        title: "No pudimos procesar el cambio de plan",
        description: error instanceof Error ? error.message : "Inténtalo de nuevo en unos minutos.",
        variant: "error",
      });
    } finally {
      setIsUpgrading(null);
    }
  };

  if (loading) {
      return (
          <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
      );
  }

  const getIcon = (name: string) => {
    if (name.includes("PREMIUM")) return <Zap className="h-6 w-6 text-amber-400" />;
    if (name.includes("FREEMIUM")) return <CreditCard className="h-6 w-6 text-slate-500" />;
    if (name.includes("INTEREST")) return <Users className="h-6 w-6 text-blue-500" />;
    if (name.includes("ENROLLMENT")) return <CheckCircle className="h-6 w-6 text-emerald-500" />;
    if (name.includes("MESSAGE")) return <MessageSquare className="h-6 w-6 text-violet-500" />;
    return <ArrowUpRight className={`h-6 w-6 ${accentTextClass}`} />;
  };

  const getPriceLabel = (plan: Plan) => {
    if (plan.pricingModel === "variable") return "comisión";
    if (plan.pricingModel === "per_event") {
        if (plan.name.includes("INTEREST")) return "/ contacto";
        return "/ evento";
    }
    return "/ mes";
  };

  const renderPlanCard = (plan: Plan) => {
    const isCurrentPlan = activePlans.some(ap => ap.plan.id === plan.id);
    const isProcessing = isUpgrading === plan.id;
    const isPopular = plan.name === "PREMIUM_SUBSCRIPTION";
    const isVariable = plan.pricingModel === "variable";

    return (
      <article
        key={plan.id}
        className={`relative flex h-full flex-col rounded-[2rem] border border-slate-200/80 bg-white px-6 py-6 shadow-md transition duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
          isPopular ? "md:-mt-4 md:pb-8 border-amber-200" : ""
        } ${isCurrentPlan ? `ring-2 ${accentRingClass} ${accentLightBgClass}/10` : ""}`}
      >
        {isPopular ? (
          <div className="absolute inset-x-8 -top-4 flex justify-center">
            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
              Mas popular
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 shadow-sm">
            {getIcon(plan.name)}
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 sm:text-base">
              {plan.name.replace("_SUBSCRIPTION", "").replaceAll("_", " ")}
            </h2>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {isVariable ? `${plan.price}%` : `$${plan.price}`}
            <span className="ml-1 align-middle text-xs font-semibold text-slate-400">
              {getPriceLabel(plan)}
            </span>
          </p>
        </div>

        <ul className="mt-4 space-y-2 text-[10px] text-slate-700 sm:text-xs">
          {plan.features.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
              <span>
                {feature}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-6 mt-auto pt-6">
          {isCurrentPlan ? (
            <button
              type="button"
              disabled
              className={`inline-flex w-full items-center justify-center rounded-full border ${accentBorderClass} ${accentLightBgClass} px-4 py-2 text-xs font-bold ${accentTextClass} sm:text-sm`}
            >
              Tu plan actual
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleUpgrade(plan.id)}
              disabled={isUpgrading !== null}
              className={`inline-flex w-full items-center justify-center rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition ${accentHoverBgClass} hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm`}
            >
              {isProcessing ? "Procesando..." : plan.type === "lead" ? "Activar servicio" : "Cambiar a este plan"}
            </button>
          )}
        </div>
      </article>
    );
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.14),_transparent_42%),linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-6 py-8 sm:px-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Planes y pagos
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                {isCourseMode ? "Controla tu visibilidad como instructor" : "Escala el alcance de tu escuela con el plan correcto"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Combina suscripción base y servicios por uso según el volumen de leads, mensajes o inscripciones que quieras activar.
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(settingsHref)}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
            >
              <Sparkles size={16} />
              Actualizar datos de pago
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <MetricCard label="Suscripciones activas" value={`${activePlans.filter((plan) => plan.plan.name.includes("SUBSCRIPTION")).length}`} />
            <MetricCard label="Servicios por uso" value={`${activePlans.filter((plan) => !plan.plan.name.includes("SUBSCRIPTION")).length}`} />
            <MetricCard label="Opciones disponibles" value={`${subscriptionPlans.length + addonPlans.length}`} accent accentClass={accentTextClass} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 px-4">
            <div className={`h-1 w-8 rounded-full ${accentBgClass}`} />
            <h2 className="text-lg font-bold text-slate-800">Suscripción Mensual</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-5xl mx-auto">
            {subscriptionPlans.map(renderPlanCard)}
        </div>
      </section>

      <section className="space-y-4 pt-8">
        <div className="flex items-center gap-2 px-4">
            <div className={`h-1 w-8 rounded-full bg-slate-400`} />
            <h2 className="text-lg font-bold text-slate-800">Servicios por Uso / Leads</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-5xl mx-auto">
            {addonPlans.map(renderPlanCard)}
        </div>
      </section>

      <section className="surface mt-2 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-slate-200/80 bg-white px-6 py-5 shadow-md sm:flex-row sm:items-center sm:px-8 sm:py-6">
        <div className="flex items-start gap-3">
          <div className={`mt-1 flex h-9 w-9 items-center justify-center rounded-2xl ${accentLightBgClass} ${accentTextClass} shadow-sm`}>
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
          onClick={() => router.push(settingsHref)}
          className={`inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition ${accentHoverBgClass} hover:shadow-lg sm:text-sm`}
        >
          Configurar pagos
        </button>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  accent = false,
  accentClass = "text-slate-950",
}: {
  label: string;
  value: string;
  accent?: boolean;
  accentClass?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </p>
      <p className={`mt-3 text-2xl font-semibold ${accent ? accentClass : "text-slate-950"}`}>
        {value}
      </p>
    </div>
  );
}
