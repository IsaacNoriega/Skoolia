import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LeadMetadataEditor } from "@/components/leads/LeadMetadataEditor";
import { LeadStatusBadge } from "@/components/leads/LeadStatusBadge";
import type { Lead } from "@/lib/types/lead";
import { Calendar, User, MessageSquare, ExternalLink, ArrowRight, Lock, Hash, BookOpen, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

import type { SchoolActivePlan } from "@/lib/services/services/subscriptions.service";

export function LeadCard({ 
    lead, 
    activePlans = [] 
}: { 
    lead: Lead, 
    activePlans?: SchoolActivePlan[] 
}) {
  const isUnlocked = activePlans.some(p => 
    p.plan.name === "PREMIUM_SUBSCRIPTION" || 
    p.plan.name === "LEAD_INTEREST" || 
    p.plan.name === "LEAD_ENROLLMENT"
  );

  const pathname = usePathname();
  const isSchoolDashboard = pathname.startsWith("/schools");
  const baseMessagePath = isSchoolDashboard ? "/schools/messages" : "/courses/messages";
  const threadId = `${lead.targetId}_${lead.userId}`;
  const chatUrl = `${baseMessagePath}?thread=${threadId}`;

  const date = new Date(lead.createdAt);
  const formattedDate = format(date, "d 'de' MMMM", { locale: es });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-500 flex flex-col gap-6"
    >
      {/* 🏷️ STATUS BADGES */}
      <div className="flex flex-wrap gap-2">
        <LeadStatusBadge status={lead.status} />
        <span className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
          {lead.originType === "COURSE" ? "Curso" : "Institución"}
        </span>
        {!isUnlocked && (
          <span className="px-3 py-1 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
            <Lock size={10} /> Datos Ocultos
          </span>
        )}
      </div>

      {/* 👤 IDENTITY */}
      <div className="space-y-2">
        <h3 className={`text-2xl font-black text-slate-950 tracking-tight leading-tight ${!isUnlocked ? "blur-md select-none opacity-40" : ""}`}>
          {lead.userName || "Prospecto Anónimo"}
        </h3>
        <p className="text-sm font-medium text-slate-500 tracking-tight">
          Interesado en {lead.originType === "COURSE" ? "un curso" : "admisión general"} • {formattedDate}
        </p>
      </div>

      {/* 🍱 BENTO INFO (Simplified) */}
      <div className="py-4 border-t border-slate-50">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
          <span>Folio</span>
          <span className="font-mono text-slate-500">#{lead.targetId.slice(0, 8)}</span>
        </div>
      </div>

      {/* 🏁 ACTIONS (Academic Style) */}
      <div className="mt-auto flex items-center gap-3">
        {isUnlocked ? (
          <>
            <Link 
              href={chatUrl}
              className="flex-1 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all"
            >
              <MessageSquare size={14} /> Chatear
            </Link>
            <button className="h-12 px-6 rounded-xl bg-slate-50 border border-slate-100 text-slate-900 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Detalles
            </button>
          </>
        ) : (
          <Link 
            href={isSchoolDashboard ? "/schools/plans" : "/courses/plans"}
            className="w-full h-12 rounded-xl bg-slate-950 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
          >
            <Lock size={14} /> Desbloquear
          </Link>
        )}
      </div>
    </motion.div>
  );
}
