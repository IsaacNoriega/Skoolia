import React, { useState, useMemo } from "react";
import { LeadCard } from "@/components/leads/LeadCard";
import type { Lead, LeadStatus } from "@/lib/types/lead";
import { Search, Filter, Users, Sparkles, TrendingUp, CheckCircle } from "lucide-react";

import type { SchoolActivePlan } from "@/lib/services/services/subscriptions.service";

export function LeadsDashboard({ 
  leads, 
  activePlans = [] 
}: { 
  leads: Lead[], 
  activePlans?: SchoolActivePlan[] 
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<LeadStatus | "ALL">("ALL");

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = lead.userName?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter(l => l.status === "NUEVO").length,
      interested: leads.filter(l => l.status === "INTERESADO").length,
      converted: leads.filter(l => l.status === "INSCRITO").length,
    };
  }, [leads]);

  return (
    <div className="max-w-7xl mx-auto py-16 px-6 space-y-16">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
        <div className="space-y-6 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
            <Users size={14} className="stroke-[3px]" />
            SISTEMA CRM SKOOLIA
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-[0.95]" style={{ fontFamily: 'SF Pro, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' }}>
            Control de <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600">Prospectos</span>
          </h1>
          <p className="text-slate-500 text-xl font-medium leading-relaxed">
            Analiza, gestiona y convierte tus leads en alumnos con nuestra interfaz de seguimiento inteligente.
          </p>
        </div>

        {/* Executive Stats Grid */}
        <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
          {[
            { label: "Total Leads", value: stats.total, icon: Users, color: "text-slate-900", bg: "bg-slate-50" },
            { label: "Nuevos", value: stats.new, icon: Sparkles, color: "text-blue-600", bg: "bg-blue-50" },
            { label: "En Proceso", value: stats.interested, icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
            { label: "Convertidos", value: stats.converted, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
          ].map((stat) => (
            <div key={stat.label} className="group flex flex-col p-6 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <stat.icon size={20} className="stroke-[2.5px]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Advanced Control Bar */}
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between bg-slate-900 p-4 rounded-[2.5rem] shadow-2xl shadow-slate-900/20">
        <div className="relative w-full md:w-1/3">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-4 bg-slate-800/50 border border-slate-700 rounded-[1.5rem] focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-white placeholder-slate-500 text-sm font-bold"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto px-2">
          {(["ALL", "NUEVO", "INTERESADO", "VISITA", "INSCRITO"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                statusFilter === status
                  ? "bg-white text-slate-900 shadow-lg"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {status === "ALL" ? "Todos" : status}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Leads Display */}
      {(!filteredLeads || filteredLeads.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-200 transition-all">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-slate-300 mb-8 shadow-xl border border-slate-100">
            <Filter size={40} className="stroke-[1.5px]" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">Sin coincidencias</h3>
          <p className="text-slate-400 mt-2 font-medium">Refina los criterios de búsqueda o filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredLeads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} activePlans={activePlans} />
          ))}
        </div>
      )}
    </div>
  );
}

