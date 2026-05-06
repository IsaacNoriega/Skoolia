import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeadMetadataEditor } from "@/components/leads/LeadMetadataEditor";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import type { Lead } from "@/lib/types/lead";
import { Calendar, User, MessageSquare, ExternalLink, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function LeadCard({ lead }: { lead: Lead }) {
  const pathname = usePathname();
  const isSchoolDashboard = pathname.startsWith("/schools");
  const baseMessagePath = isSchoolDashboard ? "/schools/messages" : "/courses/messages";
  const threadId = `${lead.targetId}_${lead.userId}`;
  const chatUrl = `${baseMessagePath}?thread=${threadId}`;

  const date = new Date(lead.createdAt);
  const formattedDate = format(date, "d 'de' MMMM, yyyy", { locale: es });

  return (
    <div
      className="group relative rounded-[2.5rem] p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col gap-6 overflow-hidden"
      style={{ fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}
    >
      {/* Dynamic Background Element */}
      <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 ${
        lead.originType === "COURSE" ? "bg-violet-500" : "bg-indigo-500"
      }`} />

      {/* Header Area */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl font-black text-2xl shadow-inner transition-transform duration-500 group-hover:scale-110 ${
            lead.originType === "COURSE" 
              ? "bg-violet-50 text-violet-600" 
              : "bg-indigo-50 text-indigo-600"
          }`}>
            {lead.userName?.[0]?.toUpperCase() || <User size={28} />}
          </div>
          <div>
            <h3 className="font-black text-slate-900 text-xl leading-none tracking-tight group-hover:text-indigo-600 transition-colors">
              {lead.userName || "Usuario anónimo"}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <Calendar size={12} className="stroke-[2.5px]" />
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>

      {/* Origin & Info Section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              lead.originType === "COURSE" ? "bg-violet-500" : "bg-indigo-500"
            }`} />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
              Interés: {lead.originType === "COURSE" ? "Curso / Taller" : "Institución Educativa"}
            </span>
          </div>
          <div className="text-[10px] font-bold text-slate-400">
            #{lead.targetId.slice(0, 8)}
          </div>
        </div>

        {/* Tags and Trigger */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-500 text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
            <MessageSquare size={12} className="text-slate-400 stroke-[2.5px]" />
            {lead.lastTrigger.replace("_", " ")}
          </div>
          {lead.metadata?.tags?.map((tag: string) => (
            <span key={tag} className="px-3 py-2 rounded-xl bg-white text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm shadow-indigo-500/5">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Note/Interaction snippet */}
      {lead.metadata?.notes?.[0] && (
        <div className="relative bg-slate-50/50 rounded-2xl p-5 border border-slate-100/50 group-hover:bg-white group-hover:border-slate-200 transition-all duration-300">
          <p className="text-sm text-slate-600 font-medium leading-relaxed">
            "{lead.metadata.notes[0]}"
          </p>
          <div className="absolute top-0 right-4 -translate-y-1/2 bg-white px-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
            Última nota
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="mt-auto pt-6 flex items-center justify-between gap-4 border-t border-slate-100">
        <LeadMetadataEditor leadId={lead.id} initialMetadata={lead.metadata || {}} />
        
        <Link 
          href={chatUrl}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            lead.originType === "COURSE" 
              ? "bg-violet-600 text-white hover:bg-violet-700 hover:shadow-lg hover:shadow-violet-500/30" 
              : "bg-slate-900 text-white hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30"
          }`}
        >
          Chat <ArrowRight size={14} className="stroke-[3px]" />
        </Link>
      </div>

      {/* Secret ID display on hover */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-tighter">
          UUID: {lead.id.slice(0, 8)}
        </div>
      </div>
    </div>
  );
}

