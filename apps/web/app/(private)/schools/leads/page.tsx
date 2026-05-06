"use client";

import { useState, useEffect } from "react";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { useLeads } from "@/lib/hooks/useLeads";
import { schoolsService, type School } from "@/lib/services/services/schools.service";
import { Loader2 } from "lucide-react";

export default function SchoolsLeadsPage() {
  const [school, setSchool] = useState<School | null>(null);
  
  useEffect(() => {
    schoolsService.getMySchool().then(setSchool);
  }, []);

  const { leads, loading, error } = useLeads(school?.id || "", "SCHOOL", school?.ownerId, true);

  if (!school && loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <LeadsDashboard leads={leads} />
    </div>
  );
}

