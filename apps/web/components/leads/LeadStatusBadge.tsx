import React from "react";
import { LeadStatus } from "@/lib/types/lead";
import { CheckCircle2, Clock, Eye, Sparkles } from "lucide-react";

const STATUS_CONFIG: Record<LeadStatus, { label: string; bg: string; text: string; border: string; icon: any; glow: string }> = {
  NUEVO: {
    label: "NUEVO",
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    icon: Sparkles,
    glow: "shadow-blue-500/20",
  },
  INTERESADO: {
    label: "INTERESADO",
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    icon: Eye,
    glow: "shadow-amber-500/20",
  },
  VISITA: {
    label: "VISITA AGENDADA",
    bg: "bg-indigo-500/10",
    text: "text-indigo-500",
    border: "border-indigo-500/20",
    icon: Clock,
    glow: "shadow-indigo-500/20",
  },
  INSCRITO: {
    label: "INSCRITO",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    icon: CheckCircle2,
    glow: "shadow-emerald-500/20",
  },
};

export function LeadStatusBadge({ status, className = "" }: { status: LeadStatus; className?: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NUEVO;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-[0.1em] border shadow-sm backdrop-blur-md transition-all duration-300 ${config.bg} ${config.text} ${config.border} ${config.glow} ${className}`}
    >
      <Icon size={10} className="stroke-[3px]" />
      {config.label}
    </span>
  );
}
