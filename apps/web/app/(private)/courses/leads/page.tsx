"use client";

import { useState, useEffect } from "react";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { useLeads } from "@/lib/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionsService, type SchoolActivePlan } from "@/lib/services/services/subscriptions.service";
import { FeatureLock } from "@/components/schools/FeatureLock";
import { Loader2 } from "lucide-react";

export default function CoursesLeadsPage() {
  const { user } = useAuth();
  const [activePlans, setActivePlans] = useState<SchoolActivePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    subscriptionsService.getActivePlans()
        .then(setActivePlans)
        .finally(() => setLoadingPlans(false));
  }, []);

  const { leads, loading } = useLeads(user?.id || "", "COURSE");

  if ((loading && !leads.length) || loadingPlans) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const hasPremium = activePlans.some(p => p.plan.name === "PREMIUM_SUBSCRIPTION");

  if (!hasPremium) {
    return (
        <FeatureLock
            title="Gestión de Prospectos"
            description="Para acceder al seguimiento de prospectos y análisis de conversión, necesitas el Plan Premium."
            requiredPlan="Premium"
        />
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <LeadsDashboard leads={leads} activePlans={activePlans} />
    </div>
  );
}

