import React from "react";
import { LeadMetadataEditor } from "@/components/leads/LeadMetadataEditor";
import type { Lead } from "@/lib/types/lead";

export function LeadCard({ lead }: { lead: Lead }) {
  const tempColor =
    lead.status === "VISITA"
      ? "border-orange-400"
      : lead.status === "INTERESADO"
      ? "border-yellow-300"
      : "border-blue-300";
  const tempLabel =
    lead.status === "VISITA"
      ? "🔥 Caliente"
      : lead.status === "INTERESADO"
      ? "🌤️ Tibio"
      : "❄️ Frío";
  return (
    <div
      className={`rounded-2xl p-6 shadow-lg bg-white flex flex-col gap-2 border-2 ${tempColor}`}
      style={{ fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      <div className="flex items-center gap-3">
        <span className="font-bold text-lg">{lead.userName}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{lead.originType}</span>
      </div>
      <div className="text-sm text-gray-500">{lead.metadata?.notes?.[0]}</div>
      <div className="flex gap-2 mt-2">
        {lead.metadata?.tags?.map((tag: string) => (
          <span key={tag} className="text-xs bg-gray-200 rounded-full px-2">{tag}</span>
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-400">{tempLabel}</div>
      <div className="mt-4">
        <LeadMetadataEditor leadId={lead.id} initialMetadata={lead.metadata || {}} />
      </div>
    </div>
  );
}
