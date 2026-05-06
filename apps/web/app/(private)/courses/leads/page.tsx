"use client";

import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { useLeads } from "@/lib/hooks/useLeads";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export default function CoursesLeadsPage() {
  const { user } = useAuth();
  const { leads, loading } = useLeads(user?.id || "", "COURSE");

  if (loading && !leads.length) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <LeadsDashboard leads={leads} />
    </div>
  );
}

