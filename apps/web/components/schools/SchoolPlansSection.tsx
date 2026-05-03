"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type JSX } from "react";
import { ArrowUpRight, CreditCard, ShieldCheck, Zap, Loader2 } from "lucide-react";

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
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activePlan, setActivePlan] = useState<SchoolActivePlan | null>(null);
  const [loading, setLoading] = useState(true);

  const isCourseMode = pathname.startsWith("/courses");
  const accentTextClass = isCourseMode ? "text-violet-600" : "text-indigo-600";
  const accentBgClass = isCourseMode ? "bg-violet-600" : "bg-indigo-600";
  const accentLightBgClass = isCourseMode ? "bg-violet-50" : "bg-indigo-50";
  const accentBorderClass = isCourseMode ? "border-violet-200" : "border-indigo-200";
  const accentRingClass = isCourseMode ? "ring-violet-500" : "ring-indigo-500";
  const accentHoverBgClass = isCourseMode ? "hover:bg-violet-700" : "hover:bg-indigo-700";


  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const [fetchedPlans, fetchedActivePlan] = await Promise.all([
          plansService.getAll(),
          subscriptionsService.getActivePlan().catch(() => null),
        ]);
        if (mounted) {
          // Filtramos solo los planes de tipo "subscription" (ej. Freemium y Premium)
          const subscriptionPlans = fetchedPlans.filter(p => p.type === "subscription");
          setPlans(subscriptionPlans);
          setActivePlan(fetchedActivePlan);
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
      setActivePlan(response.subscription);
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
    return <ArrowUpRight className={`h-6 w-6 ${accentTextClass}`} />;
  };

  return (
    <div className="space-y-6">
      <section className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          {isCourseMode ? "Gestiona tu plan de instructor" : "Gestiona el plan de tu escuela"}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-xs text-slate-600 sm:text-sm">
          Cada perfil en Skoolia puede tener su propio nivel de visibilidad.
          Elige el que mejor se adapte a tus objetivos de captación.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 justify-center max-w-4xl mx-auto">
        {plans.map((plan) => {
          const isCurrentPlan = activePlan?.plan.id === plan.id;
          const isProcessing = isUpgrading === plan.id;
          const isPopular = plan.name === "PREMIUM_SUBSCRIPTION";

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
                  <h2 className="text-base font-extrabold text-slate-900 sm:text-lg">
                    {plan.name.replace("_SUBSCRIPTION", "").replace("_", " ")}
                  </h2>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                  ${plan.price}
                  <span className="ml-1 align-middle text-xs font-semibold text-slate-400">
                    /mes
                  </span>
                </p>
              </div>

              <ul className="mt-4 space-y-2 text-xs text-slate-700 sm:text-sm">
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
                    {isProcessing ? "Procesando..." : "Cambiar a este plan"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
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
          className={`inline-flex items-center justify-center rounded-2xl border border-slate-900 bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-md transition ${accentHoverBgClass} hover:shadow-lg sm:text-sm`}
        >
          Configurar pagos
        </button>
      </section>
    </div>
  );
}
