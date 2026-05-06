import React from "react";
import { LeadStatus } from "@/lib/types/lead";
import { CheckCircle2, Clock, Eye, Sparkles } from "lucide-react";

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string; icon: any }> = {
  NUEVO: {
    label: "NUEVO CONTACTO",
    bg: "bg-blue-50/50",
    text: "text-blue-600",
    border: "border-blue-100",
    icon: Sparkles,
  },
  INTERESADO: {
    label: "PROSPECTO INTERESADO",
    bg: "bg-amber-50/50",
    text: "text-amber-600",
    border: "border-amber-100",
    icon: Eye,
  },
  VISITA: {
    label: "VISITA AGENDADA",
    bg: "bg-indigo-50/50",
    text: "text-indigo-600",
    border: "border-indigo-100",
    icon: Clock,
  },
  INSCRITO: {
    label: "CONVERTIDO / INSCRITO",
    bg: "bg-emerald-50/50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    icon: CheckCircle2,
  },
};

export function LeadStatusBadge({ status, className = "" }: { status: LeadStatus; className?: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NUEVO;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest border shadow-sm backdrop-blur-sm transition-all duration-300 ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <Icon size={12} className="stroke-[3px]" />
      {config.label}
    </span>
  );
}
