"use client";

import { useState, useEffect } from "react";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { useLeads } from "@/lib/hooks/useLeads";
import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { subscriptionsService, type SchoolActivePlan } from "@/lib/services/services/subscriptions.service";
import { FeatureLock } from "@/components/schools/FeatureLock";
import { Loader2 } from "lucide-react";

export default function SchoolsLeadsPage() {
  const [school, setSchool] = useState<School | null>(null);
  const [activePlans, setActivePlans] = useState<SchoolActivePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  useEffect(() => {
    schoolsService.getMySchool().then(setSchool);
    subscriptionsService.getActivePlans()
        .then(setActivePlans)
        .finally(() => setLoadingPlans(false));
  }, []);

  const { leads, loading } = useLeads(school?.id || "", "SCHOOL", school?.ownerId, true);

  if ((!school && loading) || loadingPlans) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
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

