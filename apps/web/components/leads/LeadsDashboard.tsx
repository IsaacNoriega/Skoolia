import React from "react";
import { LeadCard } from "@/components/leads/LeadCard";
import type { Lead } from "@/lib/types/lead";

export function LeadsDashboard({ leads }: { leads: Lead[] }) {
  console.log("[LeadsDashboard] leads:", leads);
  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Arial, sans-serif' }}>
        Leads
      </h1>
      {(!leads || leads.length === 0) ? (
        <div className="text-gray-500 text-lg">No hay leads registrados para mostrar.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}
    </div>
  );
}
